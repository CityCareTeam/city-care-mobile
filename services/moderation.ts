import { API_BASE_URL } from "@/constants/api";
import { authFetch } from "@/services/api-client";

/**
 * Modération : le contrat du serveur.
 *
 *   POST   /moderation/flags          { targetType, targetId, reason }        → 201
 *   GET    /moderation/queue                                                 → 200 [FlaggedContent]
 *   POST   /moderation/queue/{id}/hide   { comment? }                        → 204
 *   POST   /moderation/queue/{id}/keep   { comment? }                        → 204
 *
 * Implémenté côté back (`ModerationController`, branche `feat/moderation`) avec
 * les deux exigences qui ne se voient pas dans les signatures : un même
 * utilisateur ne peut signaler un contenu qu'une fois — sans quoi il fait monter
 * un compteur tout seul, d'où le 409 sur doublon — et masquer retire le contenu
 * des lectures ordinaires côté serveur. Si le mobile devait filtrer lui-même, le
 * contenu litigieux continuerait d'être envoyé à tous les téléphones, et ne
 * serait masqué que par politesse.
 *
 * `MODERATION_UNAVAILABLE` reste utile : tant qu'un serveur plus ancien tourne
 * quelque part, un 404 n'est pas une panne, et l'afficher comme telle enverrait
 * chercher un problème là où il n'y en a pas.
 */

/**
 * Les motifs reprennent, un pour un, les interdits écrits dans les conditions
 * d'utilisation. Une règle qu'on ne peut pas invoquer ne sert à rien, et un
 * motif qui ne correspond à aucune règle ne se traite pas.
 */
export const FLAG_REASONS = [
  "hateful",
  "personal_data",
  "off_topic",
  "false_report",
  "advertising",
  "other",
] as const;

export type FlagReason = (typeof FLAG_REASONS)[number];

export type FlagTarget = "incident" | "message";

export type FlaggedContent = {
  /**
   * Identifiant du groupe de signalements, pas du contenu lui-même. Le serveur
   * agrège par cible et renvoie l'identifiant du plus ancien signalement ; c'est
   * lui qu'on repasse pour trancher, et la décision vaut pour tout le groupe.
   */
  id: string;
  targetType: FlagTarget;
  targetId: string;
  /** Ce qui est reproché, tel que l'a choisi le premier signalant. */
  reason: FlagReason;
  /** Combien de personnes ont signalé ce contenu. */
  count: number;
  /** Extrait du contenu, pour juger sans avoir à ouvrir la fiche. */
  excerpt: string;
  firstFlaggedAt: string;
};

/** Marqueur d'un serveur qui ne connaît pas encore ces routes. */
export const MODERATION_UNAVAILABLE = "moderation-unavailable";

function unavailable(status: number): boolean {
  // 404 : la route n'existe pas. 501 : elle existe et n'est pas implémentée.
  return status === 404 || status === 501;
}

export async function flagContent(
  target: FlagTarget,
  targetId: string,
  reason: FlagReason,
  token: string,
): Promise<void> {
  const response = await authFetch(`${API_BASE_URL}/moderation/flags`, token, {
    method: "POST",
    body: JSON.stringify({ targetType: target, targetId, reason }),
  });

  if (unavailable(response.status)) throw new Error(MODERATION_UNAVAILABLE);
  // 409 : déjà signalé par cette personne. Ce n'est pas un échec — son geste a
  // porté la première fois.
  if (!response.ok && response.status !== 409) {
    throw new Error(`Signalement impossible (${response.status})`);
  }
}

export async function getModerationQueue(token: string): Promise<FlaggedContent[]> {
  const response = await authFetch(`${API_BASE_URL}/moderation/queue`, token);

  if (unavailable(response.status)) throw new Error(MODERATION_UNAVAILABLE);
  if (!response.ok) throw new Error(`File de modération indisponible (${response.status})`);

  const data = (await response.json()) as unknown;
  return Array.isArray(data) ? (data as FlaggedContent[]) : [];
}

/**
 * Trancher : masquer le contenu, ou le garder et clore le signalement.
 *
 * Les deux décisions passent par la même fonction parce qu'elles ont le même
 * poids — « garder » n'est pas une non-décision, c'est un arbitrage qui doit
 * laisser une trace au même titre que l'autre.
 */
export async function decideOnFlag(
  flagId: string,
  decision: "hide" | "keep",
  token: string,
  comment?: string,
): Promise<void> {
  const response = await authFetch(`${API_BASE_URL}/moderation/queue/${flagId}/${decision}`, token, {
    method: "POST",
    body: JSON.stringify({ comment }),
  });

  if (unavailable(response.status)) throw new Error(MODERATION_UNAVAILABLE);
  if (!response.ok) throw new Error(`Décision impossible (${response.status})`);
}
