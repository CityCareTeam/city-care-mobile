import { CLUSTER_DENSITY, MAP_STATUS_COLOR } from "@/constants/incidents";
import type { MapClusterDto } from "@/types/incidents";

/**
 * Couleur d'une pastille de regroupement.
 *
 * Au-delà d'un seuil de densité, le volume prend le pas sur le statut : la
 * pastille passe à un rouge absent de la palette des statuts, donc jamais
 * confondu avec elle — un coup d'œil suffit à repérer les foyers.
 *
 * En dessous, c'est le statut **majoritaire** qui donne la couleur. L'ancienne
 * règle appliquait un ordre de priorité, ce qui faisait passer un unique « en
 * cours » devant cinquante « déclarés ». À égalité, le statut le moins avancé
 * l'emporte : il reste du travail à faire.
 */
export function clusterColor(c: MapClusterDto): string {
  const dense = CLUSTER_DENSITY.find((tier) => c.count >= tier.min);
  if (dense) return dense.color;

  const byStatus: [number, string][] = [
    [c.reported, MAP_STATUS_COLOR.reported],
    [c.in_progress, MAP_STATUS_COLOR.in_progress],
    [c.resolved, MAP_STATUS_COLOR.resolved],
  ];

  return byStatus.reduce((best, cur) => (cur[0] > best[0] ? cur : best))[1];
}
