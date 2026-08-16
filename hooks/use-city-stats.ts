import { getMapSummary } from "@/services/incidents";
import { sumClusters, type CityStats } from "@/utils/city-stats";
import { useEffect, useState } from "react";

/**
 * Bilan de tous les signalements, exact.
 *
 * Une requête de plus au chargement de l'accueil, et les compteurs cessent de
 * décrire ce qui est en mémoire. Elle est légère — le serveur renvoie des
 * cellules agrégées, pas des incidents.
 *
 * Sans bornes géographiques, à dessein : rien n'oblige un signalement à tomber
 * dans une commune donnée, on peut en poser où l'on veut sur la carte. Borner
 * ce décompte reviendrait à écarter silencieusement ceux du dehors.
 *
 * Rend `null` tant qu'il n'y a rien à dire : l'écran affiche alors ce qu'il
 * peut, plutôt qu'un zéro qui passerait pour une ville sans problèmes.
 */
export function useCityStats(): CityStats | null {
  const [stats, setStats] = useState<CityStats | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const summary = await getMapSummary();
        if (alive) setStats(sumClusters(summary.data));
      } catch {
        // Sans réponse, pas de bilan : le fil reste lisible sans lui.
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return stats;
}
