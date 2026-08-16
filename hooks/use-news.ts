import { NEWS_AGENDA_UID, NEWS_API_KEY } from "@/constants/config";
import { resolveLanguage } from "@/constants/i18n";
import { usePreferences } from "@/context/PreferencesContext";
import { getNews, type NewsItem } from "@/services/news";
import { readJson, writeJson } from "@/storage/local-store";
import { useCallback, useEffect, useState } from "react";

const KEY = "news_cache";

/** Au-delà, un agenda gardé annonce des dates passées. */
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

type Cached = { items: NewsItem[]; language: string; fetchedAt: string };

/**
 * Actualités de la métropole.
 *
 * Comme le fil et la météo, le dernier état connu est gardé sur l'appareil : la
 * liste s'affiche pendant que le réseau répond, et à sa place s'il ne répond
 * pas. Le cache porte sa langue — repasser en anglais ne doit pas resservir des
 * titres français jusqu'au prochain relevé.
 */
export function useNews() {
  const { language } = usePreferences();
  const active = resolveLanguage(language);
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (force = false) => {
      if (!NEWS_AGENDA_UID || !NEWS_API_KEY) {
        setFailed(true);
        return;
      }

      if (!force) {
        const cached = await readJson<Cached>(KEY);
        const age = cached ? Date.now() - new Date(cached.fetchedAt).getTime() : Infinity;
        if (cached && cached.language === active && age < MAX_AGE_MS) {
          setItems(cached.items);
        }
      }

      try {
        const fresh = await getNews(NEWS_AGENDA_UID, NEWS_API_KEY, active);
        setItems(fresh);
        setFailed(false);
        void writeJson(KEY, {
          items: fresh,
          language: active,
          fetchedAt: new Date().toISOString(),
        } satisfies Cached);
      } catch {
        // On garde ce qui est affiché : une liste datée vaut mieux qu'un écran
        // vide, et le bandeau dira qu'elle l'est.
        setFailed(true);
      }
    },
    [active],
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
