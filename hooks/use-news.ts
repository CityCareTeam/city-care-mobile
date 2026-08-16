import { NEWS_API_KEY } from "@/constants/config";
import { resolveLanguage } from "@/constants/i18n";
import type { NewsCity } from "@/constants/news-cities";
import { usePreferences } from "@/context/PreferencesContext";
import { getNews, type NewsItem } from "@/services/news";
import { readJson, writeJson } from "@/storage/local-store";
import { useCallback, useEffect, useState } from "react";

const KEY = "news_cache";

/** Au-delà, un agenda gardé annonce des dates passées. */
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

type Cached = { items: NewsItem[]; language: string; cityId: string; fetchedAt: string };

/**
 * Les deux échecs ne se réparent pas au même endroit, et se ressemblent
 * pourtant trait pour trait à l'écran : une liste vide. `unconfigured` veut dire
 * que le binaire n'embarque pas la clé — réessayer n'y changera rien, il faut
 * republier. `network` veut dire que la requête est partie et n'est pas revenue.
 */
export type NewsFailure = "network" | "unconfigured";

/**
 * Actualités d'une ville.
 *
 * Comme le fil et la météo, le dernier état connu est gardé sur l'appareil : la
 * liste s'affiche pendant que le réseau répond, et à sa place s'il ne répond
 * pas. Le cache porte sa langue et sa ville — repasser en anglais ne doit pas
 * resservir des titres français, et changer de ville encore moins resservir
 * l'agenda de la précédente.
 *
 * Sans ville, le hook ne fait rien et ne se plaint de rien : c'est à l'écran de
 * dire pourquoi il n'y en a pas.
 */
export function useNews(city: NewsCity | null) {
  const { language } = usePreferences();
  const active = resolveLanguage(language);
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [failed, setFailed] = useState<NewsFailure | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (force = false) => {
      if (!city) return;

      if (!NEWS_API_KEY) {
        setFailed("unconfigured");
        return;
      }

      if (!force) {
        const cached = await readJson<Cached>(KEY);
        const age = cached ? Date.now() - new Date(cached.fetchedAt).getTime() : Infinity;
        const usable =
          cached && cached.language === active && cached.cityId === city.id && age < MAX_AGE_MS;
        // Une liste laissée d'une autre ville tromperait plus qu'elle
        // n'aiderait : on part de rien plutôt que de rien de juste.
        setItems(usable ? cached.items : null);
      }

      try {
        const fresh = await getNews(city.agendaUid, NEWS_API_KEY, active);
        setItems(fresh);
        setFailed(null);
        void writeJson(KEY, {
          items: fresh,
          language: active,
          cityId: city.id,
          fetchedAt: new Date().toISOString(),
        } satisfies Cached);
      } catch {
        // On garde ce qui est affiché : une liste datée vaut mieux qu'un écran
        // vide, et le bandeau dira qu'elle l'est.
        setFailed("network");
      }
    },
    [active, city],
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
