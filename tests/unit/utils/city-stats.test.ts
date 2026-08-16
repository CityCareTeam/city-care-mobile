import { sumClusters } from '@/utils/city-stats';
import type { MapClusterDto } from '@/types/incidents';

const cell = (over: Partial<MapClusterDto>): MapClusterDto => ({
  latitude: 45.75,
  longitude: 4.85,
  count: 0,
  reported: 0,
  in_progress: 0,
  resolved: 0,
  ...over,
});

describe('sumClusters', () => {
  it('additionne les cellules', () => {
    expect(
      sumClusters([
        cell({ count: 10, reported: 8, resolved: 2 }),
        cell({ count: 5, reported: 1, in_progress: 3, resolved: 1 }),
      ]),
    ).toEqual({ total: 15, reported: 9, inProgress: 3, resolved: 3 });
  });

  it('rend zéro sur une ville vide', () => {
    expect(sumClusters([])).toEqual({ total: 0, reported: 0, inProgress: 0, resolved: 0 });
  });

  // Le total vient du serveur, les parts aussi : les deux doivent coïncider,
  // et c'est ce que la carte affiche côte à côte.
  it('garde un total égal à la somme des statuts', () => {
    const stats = sumClusters([cell({ count: 7, reported: 4, in_progress: 2, resolved: 1 })]);
    expect(stats.reported + stats.inProgress + stats.resolved).toBe(stats.total);
  });
});
