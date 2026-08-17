/**
 * Lieux couverts par l'écran actualités.
 *
 * Ce n'est plus une liste d'agendas mais une liste de **points sur la carte** :
 * la source interroge un rayon, pas un identifiant. La différence est tout
 * l'intérêt — une commune de trois mille sept cents habitants entre ici au même
 * titre qu'une métropole, alors qu'elle n'a et n'aura jamais d'agenda à elle.
 *
 * Ajouter un lieu est donc du JavaScript, donc une mise à jour à la volée :
 * quatre nombres et un nom, sans rien demander à personne.
 *
 * Les coordonnées sont celles du chef-lieu, relevées sur la base adresse
 * nationale. Elles ne servent qu'à centrer la recherche et à désigner le lieu
 * le plus proche au premier lancement, jamais à cadrer une carte.
 */
export type NewsCity = {
  id: string;
  /** Nom propre : il ne se traduit pas. */
  name: string;
  latitude: number;
  longitude: number;
  /**
   * Rayon de recherche. Vingt kilomètres suffisent à couvrir une métropole ;
   * en zone rurale il faut ratisser plus large pour que la liste existe.
   */
  radiusKm: number;
};

// Par ordre alphabétique : c'est celui de la liste de choix, et aucun autre ne
// se défendrait sans vexer une ville.
export const NEWS_CITIES: readonly NewsCity[] = [
  { id: "dijon", name: "Dijon", latitude: 47.332, longitude: 5.0336, radiusKm: 20 },
  { id: "lyon", name: "Lyon", latitude: 45.758, longitude: 4.835, radiusKm: 20 },
  { id: "nantes", name: "Nantes", latitude: 47.2394, longitude: -1.5553, radiusKm: 20 },
  // Quinze et non vingt-cinq : à vingt-cinq on attrape Belley et Ambérieu, et
  // la liste devient celle du Bugey plutôt que celle du plateau. Quinze tient
  // le Valromey et les communes voisines — vingt-neuf événements à venir, ce
  // qui suffit à remplir l'écran sans mentir sur ce qu'il montre.
  {
    id: "plateau-hauteville",
    name: "Plateau d’Hauteville",
    latitude: 45.9298,
    longitude: 5.5744,
    radiusKm: 15,
  },
  { id: "rennes", name: "Rennes", latitude: 48.1109, longitude: -1.6837, radiusKm: 20 },
  { id: "toulouse", name: "Toulouse", latitude: 43.6041, longitude: 1.4338, radiusKm: 20 },
] as const;

/**
 * Jusqu'où la position peut désigner un lieu d'elle-même.
 *
 * À ne pas confondre avec le rayon de recherche ci-dessus : celui-ci décide
 * *quel* lieu proposer, celui-là *ce qu'on y cherche*.
 *
 * Quatre-vingts kilomètres, parce que le Plateau d'Hauteville est à 60,4 km de
 * Lyon. Il figure désormais dans la liste et se désigne donc lui-même, mais le
 * seuil reste haut pour ses voisins : un rayon qui tombe à quatre cents mètres
 * d'une commune réelle n'est pas un seuil, c'est un piège.
 */
export const AUTO_PICK_RADIUS_KM = 80;

export function cityById(id: string | null | undefined): NewsCity | null {
  if (!id) return null;
  return NEWS_CITIES.find((city) => city.id === id) ?? null;
}
