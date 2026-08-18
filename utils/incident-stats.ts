import { distanceKm } from "@/utils/incident-search";

/** Compte les trois statuts en une seule passe. */
export function countByStatus(incidents: { status: string }[]) {
  let reported = 0, inProgress = 0, resolved = 0;
  for (const { status } of incidents) {
    if (status === "reported") reported++;
    else if (status === "in_progress") inProgress++;
    else if (status === "resolved") resolved++;
  }
  return { reported, inProgress, resolved };
}

// ── Composants partagés ───────────────────────────────────────────────────

/**
 * Le pendant du bouton de `IncidentList` pour les cas où il n'y a pas de liste
 * à prolonger : un filtre qui ne trouve rien dans les pages déjà ouvertes n'est
 * pas une réponse, tant qu'il en reste à ouvrir.
 */

/**
 * Distance d'une ligne à l'utilisateur, ou rien quand on l'ignore.
 *
 * L'origine n'existe qu'une fois la position obtenue — c'est-à-dire une fois
 * que l'utilisateur a demandé le tri par proximité. Elle reste ensuite : savoir
 * qu'un signalement est à 300 m reste utile quand on repasse à l'ordre
 * chronologique, et rien ne justifie de le taire.
 *
 * « Mes signalements » n'embarquent pas de coordonnées : ces lignes n'affichent
 * simplement pas de distance, plutôt que d'en inventer une.
 */
export function awayKm(
  origin: { latitude: number; longitude: number } | null,
  place: { latitude?: number | null; longitude?: number | null } | undefined,
): number | undefined {
  if (!origin || place?.latitude == null || place.longitude == null) return undefined;
  return distanceKm(origin, { latitude: place.latitude, longitude: place.longitude });
}

/**
 * `onLoadMore` prolonge la liste au-delà de ce que le serveur a déjà donné. Le
 * bouton conduit donc deux gestes derrière une seule apparence : dérouler ce
 * qu'on tient en mémoire, puis, une fois au bout, aller chercher la page
 * suivante. L'utilisateur n'a pas à connaître cette frontière — il veut voir
 * plus loin, c'est tout.
 */
