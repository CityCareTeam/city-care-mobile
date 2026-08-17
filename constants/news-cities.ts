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
export type NewsSource =
  /**
   * Agrégation nationale, interrogée dans un rayon autour du lieu. Vingt
   * kilomètres couvrent une métropole ; en zone rurale on resserre pour que la
   * liste reste celle du coin et non celle du département.
   */
  | { kind: "openagenda"; radiusKm: number }
  /**
   * Page d'agenda d'un office de tourisme, lue telle quelle. Le dernier
   * recours, pour les communes que l'agrégation nationale ignore — voir
   * `services/news-tourism.ts`, qui dit ce que ça coûte.
   */
  | { kind: "page"; url: string; label: string };

export type NewsCity = {
  id: string;
  /** Nom propre : il ne se traduit pas. */
  name: string;
  latitude: number;
  longitude: number;
  /** Dans l'ordre de priorité : la première source gagne en cas de doublon. */
  sources: NewsSource[];
};

// Par ordre alphabétique : c'est celui de la liste de choix, et aucun autre ne
// se défendrait sans vexer une ville.
const NATIONAL = (radiusKm: number): NewsSource[] => [{ kind: "openagenda", radiusKm }];

export const NEWS_CITIES: readonly NewsCity[] = [
  { id: "dijon", name: "Dijon", latitude: 47.332, longitude: 5.0336, sources: NATIONAL(20) },
  { id: "lyon", name: "Lyon", latitude: 45.758, longitude: 4.835, sources: NATIONAL(20) },
  { id: "nantes", name: "Nantes", latitude: 47.2394, longitude: -1.5553, sources: NATIONAL(20) },
  {
    id: "plateau-hauteville",
    name: "Plateau d’Hauteville",
    latitude: 45.9298,
    longitude: 5.5744,
    // Le seul lieu à deux sources, et le seul qui en avait besoin. L'office du
    // Haut-Bugey publie ce qui se passe sur le plateau même — le marché du
    // mercredi, les expositions du CACL — là où l'agrégation nationale ne
    // connaît qu'un seul événement sur la commune. Le rayon de quinze
    // kilomètres complète avec le Valromey : à vingt-cinq on attrapait Belley
    // et Ambérieu, et la liste devenait celle du Bugey plutôt que la sienne.
    sources: [
      {
        kind: "page",
        url: "https://www.hautbugey-tourisme.com/bouger/agenda/plateau-dhauteville/",
        label: "Office de tourisme du Haut-Bugey",
      },
      { kind: "openagenda", radiusKm: 15 },
    ],
  },
  { id: "rennes", name: "Rennes", latitude: 48.1109, longitude: -1.6837, sources: NATIONAL(20) },
  { id: "toulouse", name: "Toulouse", latitude: 43.6041, longitude: 1.4338, sources: NATIONAL(20) },
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
