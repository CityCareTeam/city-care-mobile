import { INCIDENTS_PAGE_SIZE } from "@/constants/config";
import { getIncidents } from "@/services/incidents";
import type { IncidentListResponse, IncidentResponse } from "@/types/incidents";
import { appendUnique, mergeFreshHead } from "@/utils/incident-list";
import { useCallback, useRef, useState } from "react";

/**
 * État de la pagination, tel que les vues ont besoin de le connaître.
 * `totalCount` est le seul chiffre qui parle du jeu complet : tous les autres
 * comptages de l'écran portent sur ce qui a été chargé.
 */
export type Paging = {
  totalCount: number;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
};

/**
 * Liste d'incidents paginée par le serveur.
 *
 * L'écran d'accueil demandait une page unique de cinquante et la découpait
 * ensuite côté client : au cinquante-et-unième signalement, les plus anciens
 * devenaient inatteignables. Le fil va désormais chercher la suite.
 *
 * Deux entrées, parce que ce sont deux gestes différents :
 *
 *   - `receiveFirstPage` — le chargement d'écran, le rafraîchissement
 *     silencieux et le tiré-pour-rafraîchir passent tous par là. Seul ce
 *     dernier (`reset`) referme les pages déjà ouvertes ; les autres ne font
 *     que rafraîchir la tête de liste, sinon un relevé toutes les quinze
 *     secondes replierait la liste sous les doigts de qui la déroule.
 *   - `loadMore` — la page suivante, ajoutée à la suite.
 */
export function useIncidentsPaging() {
  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadedPages, setLoadedPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const inFlight = useRef(false);

  const receiveFirstPage = useCallback(
    (response: IncidentListResponse, { reset }: { reset: boolean }) => {
      setIncidents((prev) =>
        reset || prev.length === 0 ? response.data : mergeFreshHead(prev, response.data),
      );
      if (reset) setLoadedPages(1);
      setTotalCount(response.pagination.total_count);
      setTotalPages(response.pagination.total_pages);
    },
    [],
  );

  /**
   * Amorce la liste avec le dernier état connu, gardé sur l'appareil. Sans
   * effet dès qu'une réponse du serveur est arrivée : un cache qui écraserait
   * du frais serait pire que pas de cache du tout.
   */
  const seed = useCallback((cached: IncidentResponse[], cachedTotal: number) => {
    setIncidents((prev) => (prev.length === 0 ? cached : prev));
    setTotalCount((prev) => (prev === 0 ? cachedTotal : prev));
  }, []);

  /** Renvoie `false` si la page n'a pas pu être chargée — à l'appelant d'en tirer les conséquences. */
  const loadMore = useCallback(async (): Promise<boolean> => {
    // Un drapeau de rendu ne protège de rien ici : deux appels dans le même
    // tour de boucle liraient tous deux `false` et partiraient chercher la même
    // page. La référence, elle, est à jour dès le premier.
    if (inFlight.current || loadedPages >= totalPages) return true;
    inFlight.current = true;
    setLoadingMore(true);
    try {
      const response = await getIncidents({
        page: loadedPages + 1,
        pageSize: INCIDENTS_PAGE_SIZE.load,
      });
      setIncidents((prev) => appendUnique(prev, response.data));
      setLoadedPages((page) => page + 1);
      setTotalCount(response.pagination.total_count);
      setTotalPages(response.pagination.total_pages);
      return true;
    } catch {
      return false;
    } finally {
      inFlight.current = false;
      setLoadingMore(false);
    }
  }, [loadedPages, totalPages]);

  return {
    incidents,
    receiveFirstPage,
    seed,
    loadMore,
    totalCount,
    loadingMore,
    hasMore: loadedPages < totalPages,
  };
}
