import type { IncidentResponse } from "@/types/incidents";
import { distanceKm } from "@/utils/incident-search";

/**
 * Au-delà, ce n'est plus « près de moi ».
 *
 * Un signalement vieux de trois jours qui entre dans le fil au premier
 * chargement n'est pas une nouvelle : c'est du rattrapage. Sans cette borne, la
 * première ouverture de l'application aurait annoncé tout le quartier d'un
 * coup, et personne ne rallume ce genre de réglage deux fois.
 */
export const MAX_AGE_HOURS = 6;

/**
 * Jamais plus de trois d'affilée.
 *
 * Une rue qu'on vient de repeindre peut produire dix signalements en une heure.
 * Dix notifications les unes derrière les autres se lisent comme une panne, et
 * la onzième ne sera pas lue du tout — le fil, lui, les montre toutes.
 */
export const MAX_PER_ROUND = 3;

/** L'heure à laquelle on se tait, et celle à laquelle on reprend. */
export const QUIET_FROM = 22;
export const QUIET_UNTIL = 7;

type Options = {
  origin: { latitude: number; longitude: number };
  radiusKm: number;
  /** Déjà annoncés : on ne prévient pas deux fois du même. */
  announced: ReadonlySet<string>;
  /** Le sien ne s'annonce pas : on sait qu'on vient de l'écrire. */
  selfId?: string | null;
  now?: Date;
};

/**
 * Signalements qui méritent une notification, du plus proche au plus lointain.
 *
 * Cinq conditions, et chacune existe parce que sans elle la fonctionnalité se
 * retourne contre elle-même : trop loin, déjà annoncé, trop vieux, déjà résolu,
 * ou écrit par soi-même. Le reste est du bruit qu'on ferait sonner dans la poche
 * de quelqu'un.
 */
export function alertableIncidents(
  incidents: IncidentResponse[],
  { origin, radiusKm, announced, selfId, now = new Date() }: Options,
): IncidentResponse[] {
  const oldest = now.getTime() - MAX_AGE_HOURS * 3600_000;

  return incidents
    .filter((incident) => {
      if (announced.has(incident.id)) return false;
      if (incident.status === "resolved") return false;
      if (selfId && incident.authorUserId === selfId) return false;

      const created = new Date(incident.createdAt).getTime();
      if (!Number.isFinite(created) || created < oldest) return false;

      return distanceKm(origin, incident) <= radiusKm;
    })
    .sort((a, b) => distanceKm(origin, a) - distanceKm(origin, b))
    .slice(0, MAX_PER_ROUND);
}

/**
 * Heures pendant lesquelles on ne fait pas sonner un téléphone.
 *
 * Un nid-de-poule signalé à trois heures du matin n'a réveillé personne d'utile.
 */
export function isQuietHour(now: Date = new Date()): boolean {
  const hour = now.getHours();
  return hour >= QUIET_FROM || hour < QUIET_UNTIL;
}
