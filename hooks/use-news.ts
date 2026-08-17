import type { NewsCity } from "@/constants/news-cities";
import { getNews, type NewsItem } from "@/services/news";
import { readJson, writeJson } from "@/storage/local-store";
import { useCallback, useEffect, useState } from "react";

const KEY = "news_cache";

/** Au-delà, un agenda gardé annonce des dates passées. */
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

type Cached = { items: NewsItem[]; cityId: string; fetchedAt: string };

/**
 * Actualités d'un lieu.
 *
 * Comme le fil et la météo, le dernier état connu est gardé sur l'appareil : la
 * liste s'affiche pendant que le réseau répond, et à sa place s'il ne répond
 * pas. Le cache porte son lieu — changer de ville ne doit pas resservir les
 * événements de la précédente.
 *
 * Sans lieu, le hook ne fait rien et ne se plaint de rien : c'est à l'écran de
 * dire pourquoi il n'y en a pas.
 */
export function useNews(city: NewsCity | null) {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (force = false) => {
      if (!city) return;

      if (!force) {
        const cached = await readJson<Cached>(KEY);
        const age = cached ? Date.now() - new Date(cached.fetchedAt).getTime() : Infinity;
        const usable = cached && cached.cityId === city.id && age < MAX_AGE_MS;
        // Une liste laissée d'une autre ville tromperait plus qu'elle
        // n'aiderait : on part de rien plutôt que de rien de juste.
        setItems(usable ? cached.items : null);
      }

      try {
        const fresh = await getNews(city);
        setItems(fresh);
        setFailed(false);
        void writeJson(KEY, {
          items: fresh,
          cityId: city.id,
          fetchedAt: new Date().toISOString(),
        } satisfies Cached);
      } catch {
        // On garde ce qui est affiché : une liste datée vaut mieux qu'un écran
        // vide, et le bandeau dira qu'elle l'est.
        setFailed(true);
      }
    },
    [city],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  return { items, failed, refreshing, refresh };
}
