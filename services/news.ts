import type { NewsCity } from "@/constants/news-cities";
import { getOpenAgendaEvents } from "@/services/news-openagenda";
import { getTourismEvents } from "@/services/news-tourism";

/**
 * Une actualité, telle que l'écran la consomme.
 *
 * Volontairement pauvre : un titre, une date lisible, un lieu, une image. C'est
 * ce **contrat** qui compte, pas la source derrière — il n'a pas bougé d'une
 * ligne en passant d'un agenda OpenAgenda à une agrégation nationale, puis en
 * accueillant une page d'office de tourisme à côté.
 */
export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  /** Déjà mise en forme par la source — « Lundi 17 août, 09h00 ». */
  when: string;
  place: string | null;
  imageUrl: string | null;
  /** Début, pour fusionner deux sources dans un seul ordre chronologique. */
  startsAt: string | null;
};

/** Deux fois le même événement publié des deux côtés ne fait qu'une carte. */
function fingerprint(item: NewsItem): string {
  return `${item.title.toLowerCase().replace(/\s+/g, " ").trim()}|${item.when}`;
}

/**
 * Sans date exploitable, un événement passe en fin de liste plutôt que d'être
 * jeté : il existe, on ne sait juste pas le situer.
 */
function chronological(a: NewsItem, b: NewsItem): number {
  if (!a.startsAt) return b.startsAt ? 1 : 0;
  if (!b.startsAt) return -1;
  return a.startsAt.localeCompare(b.startsAt);
}

/**
 * Actualités d'un lieu, toutes sources confondues.
 *
 * Un lieu peut en avoir plusieurs, et le Plateau d'Hauteville est la raison
 * d'être de ce mécanisme : l'agrégation nationale ne connaît qu'un seul
 * événement sur la commune, tandis que l'office de tourisme en publie
 * vingt-quatre. L'un donne le marché du mercredi, l'autre ce qui se passe à
 * quinze kilomètres à la ronde ; ensemble ils font l'écran qu'on veut.
 *
 * Une source qui tombe n'emporte pas les autres : on rend ce qu'on a. Ce n'est
 * que si elles échouent toutes qu'on lève — auquel cas l'écran garde sa
 * dernière liste connue et affiche son bandeau.
 */
export async function getNews(city: NewsCity): Promise<NewsItem[]> {
  const attempts = city.sources.map((source) =>
    source.kind === "page"
      ? getTourismEvents(source.url)
      : getOpenAgendaEvents(city, source.radiusKm),
  );

  const settled = await Promise.allSettled(attempts);
  const failures = settled.filter((result) => result.status === "rejected");
  if (failures.length === settled.length) {
    throw failures[0]?.reason ?? new Error("Aucune source d'actualités");
  }

  const seen = new Set<string>();
  const merged: NewsItem[] = [];

  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    for (const item of result.value) {
      const key = fingerprint(item);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }

  return merged.sort(chronological);
}
