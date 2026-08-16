/**
 * Villes couvertes par l'écran actualités.
 *
 * Les identifiants d'agenda vivent ici et non dans l'environnement : ce n'est
 * pas un réglage qui change d'un canal à l'autre, c'est une liste. La
 * conséquence est agréable — ajouter une ville est du JavaScript, donc une mise
 * à jour à la volée, là où une variable d'environnement demanderait un build.
 *
 * Seule la clé de lecture reste dans l'environnement : elle est commune à tous
 * les agendas, et une clé n'a rien à faire dans un tableau de données.
 *
 * Les coordonnées sont celles du centre-ville. Elles ne servent qu'à désigner
 * la ville la plus proche au premier lancement, jamais à cadrer une carte.
 */
export type NewsCity = {
  id: string;
  /** Nom propre : il ne se traduit pas. */
  name: string;
  agendaUid: string;
  latitude: number;
  longitude: number;
};

export const NEWS_CITIES: readonly NewsCity[] = [
  { id: "lyon", name: "Lyon", agendaUid: "87532799", latitude: 45.758, longitude: 4.832 },
  { id: "rennes", name: "Rennes", agendaUid: "20500020", latitude: 48.1147, longitude: -1.6794 },
] as const;

/**
 * Au-delà, on ne propose plus rien de soi-même.
 *
 * Ces agendas couvrent une métropole, pas une région : depuis Paris, la ville
 * « la plus proche » serait Rennes à trois cents kilomètres, et une liste
 * d'événements bretons ouverte d'autorité vaudrait moins qu'une phrase disant
 * qu'aucune ville n'est couverte.
 */
export const NEWS_CITY_RADIUS_KM = 60;

export function cityById(id: string | null | undefined): NewsCity | null {
  if (!id) return null;
  return NEWS_CITIES.find((city) => city.id === id) ?? null;
}
