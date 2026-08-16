import type { MapClusterDto } from "@/types/incidents";

export type CityStats = {
  total: number;
  reported: number;
  inProgress: number;
  resolved: number;
};

/**
 * Totaux de tous les signalements, par statut.
 *
 * Les compteurs de l'accueil portaient sur **les pages chargées** du fil : ils
 * annonçaient « 50 déclarés » parce que cinquante incidents étaient en mémoire,
 * pas parce qu'il en existait cinquante. `GET /incidents/map-summary` appelé
 * sans bornes les couvre tous — où qu'ils soient posés sur la carte — et
 * ventile déjà par statut : il suffisait d'additionner ses cellules.
 *
 * Le total est recalculé à partir des statuts plutôt que repris de `total` :
 * les deux doivent coïncider, et si le serveur venait à en ajouter un troisième
 * type, mieux vaut que la somme des parts soit égale au tout qu'on affiche à
 * côté.
 */
export function sumClusters(clusters: MapClusterDto[]): CityStats {
  return clusters.reduce<CityStats>(
    (totals, cell) => ({
      total: totals.total + cell.count,
      reported: totals.reported + cell.reported,
      inProgress: totals.inProgress + cell.in_progress,
      resolved: totals.resolved + cell.resolved,
    }),
    { total: 0, reported: 0, inProgress: 0, resolved: 0 },
  );
}
