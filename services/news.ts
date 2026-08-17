import { fetchWithTimeout } from "@/services/api-client";

/**
 * Événements publics agrégés à l'échelle nationale, publiés par Opendatasoft à
 * partir des agendas OpenAgenda.
 *
 * On a d'abord interrogé OpenAgenda agenda par agenda : un identifiant par
 * métropole, tenu à la main. Ça marchait pour cinq grandes villes et pour
 * elles seules — le Plateau d'Hauteville, trois mille sept cents habitants,
 * n'a pas d'agenda et n'en aura pas.
 *
 * Cette agrégation renverse le problème : on n'interroge plus un agenda mais un
 * **point sur la carte**, et n'importe quelle commune devient couvrable.
 * Accessoirement elle est plus fournie que les agendas officiels — 979
 * événements à venir autour de Lyon contre 432, 2313 autour de Nantes contre 59
 * — et elle ne demande aucune clé, ce qui retire du binaire la seule variable
 * qui obligeait à reconstruire.
 *
 * Le prix payé : ce jeu ne porte que le français, là où OpenAgenda rendait des
 * titres multilingues. Un intitulé d'événement communal l'est de toute façon,
 * et l'interface, elle, reste traduite.
 */
const ENDPOINT =
  "https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/evenements-publics-openagenda/records";

/**
 * Une actualité, telle que l'écran la consomme.
 *
 * Volontairement pauvre : un titre, une date lisible, un lieu, une image. C'est
 * ce **contrat** qui compte, pas la source derrière — il n'a pas bougé d'une
 * ligne en changeant de fournisseur.
 */
export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  /** Déjà mise en forme par la source — « Lundi 17 août, 09h00 ». */
  when: string;
  place: string | null;
  imageUrl: string | null;
  /** Début du premier créneau, pour trier et pour écarter le passé. */
  startsAt: string | null;
};

type Record = {
  uid?: string;
  title_fr?: string | null;
  description_fr?: string | null;
  daterange_fr?: string | null;
  firstdate_begin?: string | null;
  location_name?: string | null;
  location_city?: string | null;
  thumbnail?: string | null;
  image?: string | null;
};

/**
 * Agendas écartés, repérés par leur identifiant dans l'URL canonique.
 *
 * France Travail publie ses ateliers et ses « flash visio » sur OpenAgenda, en
 * les épinglant à l'adresse de l'agence la plus proche. Ce sont 54 % des
 * événements à venir autour du Plateau d'Hauteville, 37 % autour de Lyon — et
 * pour beaucoup des visioconférences nationales, qui ne se passent nulle part.
 * Un tableau de ce qui se passe en ville n'est pas un calendrier d'agence pour
 * l'emploi ; sans eux, la même requête rend des expositions, une nuit de la
 * chauve-souris et une vente de galettes.
 */
const EXCLUDED_PUBLISHERS = ["francetravail"];

/** Quelques résumés arrivent avec leurs balises ; un `<Text>` les afficherait. */
function plain(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * ODSQL est un langage de filtre : les apostrophes y délimitent les chaînes.
 * Aucune valeur interpolée ici n'en contient — ce sont des nombres — mais la
 * fonction est le seul endroit où l'on construit la requête, et c'est ici qu'on
 * s'en assure.
 */
function around(latitude: number, longitude: number, radiusKm: number): string {
  const point = `GEOM'POINT(${longitude.toFixed(5)} ${latitude.toFixed(5)})'`;
  const from = new Date().toISOString();
  // Strictement à venir. Le jeu garde les événements tant qu'ils courent, et
  // trier sans filtrer mettait en tête des expositions ouvertes depuis avril :
  // une liste dont les cinq premières dates sont passées a l'air cassée.
  const excluded = EXCLUDED_PUBLISHERS.map((slug) => ` AND NOT canonicalurl LIKE '${slug}'`).join("");
  return `distance(location_coordinates, ${point}, ${Math.round(radiusKm)}km) AND firstdate_begin>='${from}'${excluded}`;
}

export async function getNews(
  place: { latitude: number; longitude: number },
  radiusKm: number,
  size = 25,
): Promise<NewsItem[]> {
  const url =
    `${ENDPOINT}?where=${encodeURIComponent(around(place.latitude, place.longitude, radiusKm))}` +
    `&order_by=firstdate_begin&limit=${size}`;

  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`Actualités indisponibles (${response.status})`);

  const data = (await response.json()) as { results?: Record[] };

  return (data.results ?? []).map((record) => ({
    id: String(record.uid ?? ""),
    title: plain(record.title_fr),
    summary: plain(record.description_fr),
    when: record.daterange_fr ?? "",
    // Le nom du lieu d'abord : « Salle des fêtes » situe mieux que « Belley »
    // quand on est déjà à Belley.
    place: record.location_name ?? record.location_city ?? null,
    // La vignette plutôt que l'originale : une carte de liste n'a pas besoin de
    // sept cents pixels de large.
    imageUrl: record.thumbnail ?? record.image ?? null,
    startsAt: record.firstdate_begin ?? null,
  }));
}
