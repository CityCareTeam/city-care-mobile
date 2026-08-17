import type { Dictionary } from "@/constants/i18n";
import type { NewsItem } from "@/services/news";

export type NewsPeriod = "today" | "week" | "month" | "later" | "undated";

export type NewsSection = { period: NewsPeriod; title: string; data: NewsItem[] };

/**
 * Découpe une liste d'événements en tranches de temps.
 *
 * C'est ce qui manquait le plus à cet écran. Vingt-cinq dates à la file, de
 * demain à novembre, sans repère : il fallait lire chaque ligne pour savoir où
 * s'arrêtait ce week-end. Un agenda se parcourt par périodes, et la seule
 * question qu'on lui pose est « qu'est-ce qu'il y a bientôt ».
 *
 * Les périodes ne se recouvrent pas et l'ordre est conservé : la source rend
 * déjà les événements du plus proche au plus lointain.
 */
export function groupByPeriod(
  items: NewsItem[],
  t: Dictionary,
  now: Date = new Date(),
): NewsSection[] {
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const day = 86_400_000;

  const buckets: Record<NewsPeriod, NewsItem[]> = {
    today: [],
    week: [],
    month: [],
    later: [],
    undated: [],
  };

  for (const item of items) {
    const start = item.startsAt ? new Date(item.startsAt).getTime() : NaN;
    if (!Number.isFinite(start)) {
      // Sans date, on ne devine pas : une section à part vaut mieux qu'un
      // classement au hasard.
      buckets.undated.push(item);
      continue;
    }

    const days = Math.floor((start - midnight.getTime()) / day);
    if (days <= 0) buckets.today.push(item);
    else if (days <= 7) buckets.week.push(item);
    else if (days <= 31) buckets.month.push(item);
    else buckets.later.push(item);
  }

  const titles: Record<NewsPeriod, string> = {
    today: t.news.today,
    week: t.news.thisWeek,
    month: t.news.thisMonth,
    later: t.news.later,
    undated: t.news.undated,
  };

  // Les sections vides n'apparaissent pas : un intertitre qui ne coiffe rien
  // fait croire à un chargement inachevé.
  return (["today", "week", "month", "later", "undated"] as NewsPeriod[])
    .filter((period) => buckets[period].length > 0)
    .map((period) => ({ period, title: titles[period], data: buckets[period] }));
}
