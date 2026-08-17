import type { IncidentResponse } from "@/types/incidents";
import { distanceKm } from "@/utils/incident-search";

/**
 * Rayon au-delà duquel deux signalements du même type ne parlent plus de la
 * même chose.
 *
 * Cinquante mètres, soit la longueur d'une façade d'immeuble. Plus large, on
 * confondrait deux nids-de-poule distincts d'une même rue et on découragerait un
 * signalement légitime ; plus étroit, la dérive du GPS en ville — dix à trente
 * mètres entre les immeubles — suffirait à faire passer le même trou pour deux.
 */
export const DUPLICATE_RADIUS_M = 50;

/**
 * Signalements susceptibles de désigner la même chose que celui qu'on est en
 * train de rédiger, du plus proche au plus lointain.
 *
 * C'est le premier travers d'une application de signalement citoyen : la même
 * bouche d'égout déclarée quinze fois par quinze passants, et un agent qui trie
 * à la main. Autant le dire à celui qui s'apprête à le faire — il n'a
 * généralement aucun moyen de le savoir.
 *
 * Les signalements résolus sont écartés : le même trou rebouché puis rouvert est
 * un nouveau problème, pas un doublon. Ceux qui sont encore ouverts, si.
 */
export function findDuplicates(
  incidents: IncidentResponse[],
  place: { latitude: number; longitude: number },
  type: string | null,
  radiusM: number = DUPLICATE_RADIUS_M,
): IncidentResponse[] {
  if (!type) return [];

  return incidents
    .filter((incident) => incident.type === type && incident.status !== "resolved")
    .map((incident) => ({
      incident,
      km: distanceKm(place, { latitude: incident.latitude, longitude: incident.longitude }),
    }))
    .filter(({ km }) => km * 1000 <= radiusM)
    .sort((a, b) => a.km - b.km)
    .map(({ incident }) => incident);
}

/** Distance en mètres, arrondie à ce qu'un piéton sait estimer. */
export function metersBetween(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const meters = distanceKm(from, to) * 1000;
  return meters < 10 ? Math.round(meters) : Math.round(meters / 5) * 5;
}
