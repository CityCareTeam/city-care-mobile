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
 * Les coordonnées sont celles du chef-lieu, relevées sur la base adresse
 * nationale. Elles ne servent qu'à désigner la ville la plus proche au premier
 * lancement, jamais à cadrer une carte.
 */
export type NewsCity = {
  id: string;
  /** Nom propre : il ne se traduit pas. */
  name: string;
  agendaUid: string;
  latitude: number;
  longitude: number;
};

// Par ordre alphabétique : c'est celui de la liste de choix, et aucun autre ne
// se défendrait sans vexer une ville.
export const NEWS_CITIES: readonly NewsCity[] = [
  { id: "dijon", name: "Dijon", agendaUid: "78167052", latitude: 47.332, longitude: 5.0336 },
  { id: "lyon", name: "Lyon", agendaUid: "87532799", latitude: 45.758, longitude: 4.835 },
  { id: "nantes", name: "Nantes", agendaUid: "26188004", latitude: 47.2394, longitude: -1.5553 },
  { id: "rennes", name: "Rennes", agendaUid: "20500020", latitude: 48.1109, longitude: -1.6837 },
  { id: "toulouse", name: "Toulouse", agendaUid: "50522407", latitude: 43.6041, longitude: 1.4338 },
] as const;

/**
 * Au-delà, on ne propose plus rien de soi-même.
 *
 * Ces agendas couvrent une métropole, pas une région : depuis Paris, la ville
 * « la plus proche » serait Rennes à trois cents kilomètres, et une liste
 * d'événements bretons ouverte d'autorité vaudrait moins qu'une phrase disant
 * qu'aucune ville n'est couverte.
 *
 * Quatre-vingts et non soixante, parce que le Plateau d'Hauteville est à 60,4
 * kilomètres de Lyon. Un seuil qui tombe à quatre cents mètres d'une commune
 * réelle n'est pas un seuil, c'est un piège : de part et d'autre de la même
 * rue, l'écran s'ouvrirait sur Lyon ou sur une phrase d'excuse. Le rayon dit
 * maintenant « la métropole où l'on se déplace », pas « celle où l'on habite ».
 */
export const NEWS_CITY_RADIUS_KM = 80;

export function cityById(id: string | null | undefined): NewsCity | null {
  if (!id) return null;
  return NEWS_CITIES.find((city) => city.id === id) ?? null;
}
