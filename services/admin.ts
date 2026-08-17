import { API_BASE_URL } from "@/constants/api";
import { authFetch, parseApiError } from "@/services/api-client";

/**
 * Administration des comptes.
 *
 *   GET /admin/users?search=&first=&max=          → liste, recherche côté Keycloak
 *   PUT /admin/users/{keycloakId}/role   { role }  → change le rôle
 *   PUT /admin/users/{keycloakId}/enabled { enabled } → active ou désactive
 *
 * Les comptes vivent dans Keycloak, pas dans la base applicative : c'est lui qui
 * détient l'identité, les rôles et l'état actif. Le serveur ne fait que relayer,
 * avec ses droits d'administration — d'où l'identifiant Keycloak comme clé, et
 * non celui de la table `users`.
 *
 * Le serveur refuse qu'un administrateur se rétrograde ou se désactive lui-même :
 * ce serait s'enfermer dehors, et la seule voie de retour serait la console
 * Keycloak. L'écran n'offre donc pas ces gestes sur sa propre ligne.
 */

/**
 * Les rôles tels qu'ils circulent, en minuscules.
 *
 * C'est ce que renvoie `GET /admin/users` — le serveur normalise le rôle
 * Keycloak en minuscules avant de l'envoyer. Les avoir écrits en capitales ici
 * faisait échouer toute comparaison en silence : la page n'affichait le rôle
 * d'aucun compte, chaque pastille paraissant éteinte.
 */
export const ADMIN_ROLES = ["citizen", "agent", "admin"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

/**
 * Le nom attendu à l'écriture, capitalisé.
 *
 * `PUT /admin/users/{id}/role` désérialise vers une énumération .NET, dont les
 * valeurs sont `Citizen`, `Agent`, `Admin`. La lecture rend des minuscules,
 * l'écriture veut des capitales : la traduction se fait ici, une fois, plutôt
 * que d'obliger chaque appelant à s'en souvenir.
 */
const WIRE_TO_ENUM: Record<AdminRole, string> = {
  citizen: "Citizen",
  agent: "Agent",
  admin: "Admin",
};

/** Clé du libellé traduit, partagée avec le reste de l'application. */
export const ROLE_LABEL_KEY: Record<AdminRole, "Citizen" | "Agent" | "Admin"> = WIRE_TO_ENUM as Record<
  AdminRole,
  "Citizen" | "Agent" | "Admin"
>;

export type AdminUser = {
  /** Identifiant Keycloak — la clé de toutes les routes d'administration. */
  id: string;
  username: string;
  email: string | null;
  display_name: string;
  /** Faux = compte désactivé : il ne peut plus se connecter. */
  enabled: boolean;
  /** Nul quand le compte n'a aucun rôle applicatif. */
  role: AdminRole | null;
  /**
   * Dernière activité, arrondie au quart d'heure par le serveur.
   *
   * Nulle pour un compte créé mais jamais utilisé — l'écran dit alors « jamais
   * vu » plutôt que d'inventer une date. C'est une date de venue, pas un suivi :
   * le serveur retient quand, jamais quoi.
   */
  last_seen_at: string | null;
};

/**
 * Taille d'une page de comptes.
 *
 * Petite, et pas seulement pour l'écran : le serveur interroge Keycloak une fois
 * par compte pour connaître son rôle, donc une page de cent comptes fait cent
 * allers-retours avant de répondre. Vingt-cinq arrivent vite et suffisent à
 * remplir un téléphone.
 */
export const ADMIN_PAGE_SIZE = 25;

export async function getAdminUsers(
  token: string,
  search?: string,
  /** Rang du premier compte demandé — `0` pour la première page. */
  first = 0,
): Promise<AdminUser[]> {
  const url = new URL(`${API_BASE_URL}/admin/users`);
  if (search?.trim()) url.searchParams.set("search", search.trim());
  url.searchParams.set("first", String(first));
  url.searchParams.set("max", String(ADMIN_PAGE_SIZE));

  const response = await authFetch(url.toString(), token);
  if (!response.ok) throw new Error(await parseApiError(response, `Erreur ${response.status}`));

  const body = (await response.json()) as { data?: AdminUser[] };
  return Array.isArray(body.data) ? body.data : [];
}

export async function setUserRole(
  keycloakId: string,
  role: AdminRole,
  token: string,
): Promise<void> {
  const response = await authFetch(`${API_BASE_URL}/admin/users/${keycloakId}/role`, token, {
    method: "PUT",
    body: JSON.stringify({ role: WIRE_TO_ENUM[role] }),
  });
  if (!response.ok) throw new Error(await parseApiError(response, `Erreur ${response.status}`));
}

/**
 * Activer ou désactiver un compte.
 *
 * « Désactivé » plutôt que « supprimé » : le compte cesse de pouvoir se
 * connecter, ses signalements restent. Supprimer emporterait des contenus qui
 * appartiennent à la ville autant qu'à lui, et ne se rattrape pas.
 */
export async function setUserEnabled(
  keycloakId: string,
  enabled: boolean,
  token: string,
): Promise<void> {
  const response = await authFetch(`${API_BASE_URL}/admin/users/${keycloakId}/enabled`, token, {
    method: "PUT",
    body: JSON.stringify({ enabled }),
  });
  if (!response.ok) throw new Error(await parseApiError(response, `Erreur ${response.status}`));
}
