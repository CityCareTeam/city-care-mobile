import { fetchWithTimeout } from "@/services/api-client";
import type { Language } from "@/constants/i18n";

const ENDPOINT = "https://api.openagenda.com/v2/agendas";

/**
 * Une actualité, telle que l'écran la consomme.
 *
 * Volontairement pauvre : un titre, une date lisible, un lieu, une image. C'est
 * ce **contrat** qui compte, pas la source derrière. OpenAgenda est le premier
 * fournisseur branché, après avoir constaté que ni lyon.fr ni le portail du
 * Grand Lyon n'exposent de flux d'actualités utilisable ; le jour où l'un des
 * deux en publiera un, seul ce fichier changera.
 */
export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  /** Déjà mise en forme par la source — « 18 - 20 septembre ». */
  when: string;
  place: string | null;
  imageUrl: string | null;
  /** Début du prochain créneau, pour trier et pour écarter le passé. */
  startsAt: string | null;
};

type Localized = Record<string, string | undefined> | string | null | undefined;

/**
 * OpenAgenda rend ses textes dans toutes les langues saisies par l'organisateur
 * — parfois cinq, parfois une seule, et pas toujours celle qu'on demande. On
 * prend la langue active, puis le français, puis ce qui existe : un titre dans
 * la mauvaise langue vaut mieux qu'une carte vide.
 */
function pick(value: Localized, language: Language): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[language] ?? value.fr ?? Object.values(value).find(Boolean) ?? "";
}

/** Les balises HTML des descriptions n'ont rien à faire dans un `<Text>`. */
function plain(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type OpenAgendaEvent = {
  uid: number;
  title?: Localized;
  description?: Localized;
  dateRange?: Localized;
  nextTiming?: { begin?: string };
  firstTiming?: { begin?: string };
  location?: { name?: string; city?: string };
  image?: {
    base?: string;
    filename?: string;
    variants?: { filename?: string; type?: string }[];
  };
};

/**
 * L'image existe en plusieurs tailles. On prend la vignette : une carte de
 * liste n'a pas besoin de sept cents pixels de large, et l'écran s'ouvre plus
 * vite sur un réseau de terrain.
 */
function imageUrl(image: OpenAgendaEvent["image"]): string | null {
  if (!image?.base) return null;
  const thumbnail = image.variants?.find((variant) => variant.type === "thumbnail");
  const filename = thumbnail?.filename ?? image.filename;
  return filename ? `${image.base}${filename}` : null;
}

export async function getNews(
  agendaUid: string,
  key: string,
  language: Language,
  size = 20,
): Promise<NewsItem[]> {
  // `relative=upcoming` : ce qui est passé n'est plus une actualité. Le tri par
  // premier créneau met le plus proche en tête.
  const url =
    `${ENDPOINT}/${agendaUid}/events?key=${encodeURIComponent(key)}` +
    `&size=${size}&relative[]=upcoming&sort=firstTiming.asc`;

  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`Actualités indisponibles (${response.status})`);

  const data = (await response.json()) as { events?: OpenAgendaEvent[] };

  return (data.events ?? []).map((event) => ({
    id: String(event.uid),
    title: plain(pick(event.title, language)),
    summary: plain(pick(event.description, language)),
    when: pick(event.dateRange, language),
    place: event.location?.name ?? event.location?.city ?? null,
    imageUrl: imageUrl(event.image),
    startsAt: event.nextTiming?.begin ?? event.firstTiming?.begin ?? null,
  }));
}
