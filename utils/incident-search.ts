type Searchable = {
  description?: string | null;
  addressLabel?: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
};

export type SortMode = "recent" | "oldest" | "nearest";

/**
 * Met une chaîne en forme pour la comparaison : sans accents, sans casse.
 *
 * « Éclairage » doit se trouver en tapant « eclairage », et « VOIRIE » en tapant
 * « voirie ». Personne ne tape les accents sur un clavier de téléphone quand il
 * cherche quelque chose.
 */
export function normalize(value: string): string {
  return value
    .normalize("NFD")
    // Les diacritiques que `NFD` vient de détacher. Écrits en points de code :
    // en clair, ce sont des caractères invisibles dans le fichier.
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Un signalement correspond-il à la recherche ?
 *
 * On cherche dans la description et dans l'adresse — les deux seuls champs
 * qu'un utilisateur a en tête. Chaque mot doit se retrouver quelque part, dans
 * n'importe quel ordre : « poubelle victor » trouve « Poubelle renversée » au
 * « 12 rue Victor-Hugo ».
 */
export function matchesQuery(incident: Searchable, query: string): boolean {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  const haystack = normalize(`${incident.description ?? ""} ${incident.addressLabel ?? ""}`);
  return words.every((word) => haystack.includes(word));
}

/**
 * Distance à vol d'oiseau, en kilomètres.
 *
 * Formule de haversine : à l'échelle d'une ville, une approximation plane
 * suffirait, mais elle se déforme dès qu'on s'éloigne — et rien n'interdit à
 * quelqu'un de consulter la carte depuis l'autre bout du pays.
 */
export function distanceKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const EARTH_RADIUS_KM = 6371;
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Trie une copie, jamais la liste reçue : elle vient de l'état React, et la
 * trier sur place la modifierait sans que React le sache.
 *
 * Sans position connue, « au plus proche » ne trie rien plutôt que de trier au
 * hasard — l'ordre par défaut reste celui du serveur, du plus récent au plus
 * ancien.
 */
export function sortIncidents<T extends Searchable>(
  incidents: T[],
  mode: SortMode,
  origin: { latitude: number; longitude: number } | null,
): T[] {
  if (mode === "nearest" && !origin) return incidents;

  return [...incidents].sort((a, b) => {
    if (mode === "nearest" && origin) return distanceKm(origin, a) - distanceKm(origin, b);
    const left = Date.parse(a.createdAt);
    const right = Date.parse(b.createdAt);
    return mode === "oldest" ? left - right : right - left;
  });
}
