import { getMapSummary } from "@/services/incidents";
import { sumClusters, type CityStats } from "@/utils/city-stats";
import { useEffect, useState } from "react";

/**
 * Bilan de la ville, exact.
 *
 * Une requête de plus au chargement de l'accueil, et les compteurs cessent de
 * décrire ce qui est en mémoire pour décrire la ville. Elle est légère — le
 * serveur renvoie des cellules agrégées, pas des incidents.
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
