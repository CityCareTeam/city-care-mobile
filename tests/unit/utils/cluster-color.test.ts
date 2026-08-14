import { CLUSTER_DENSITY, MAP_STATUS_COLOR, STATUS_COLOR } from '@/constants/incidents';
import type { MapClusterDto } from '@/types/incidents';
import { clusterColor } from '@/utils/cluster-color';

const cluster = (parts: Partial<MapClusterDto>): MapClusterDto => ({
  latitude: 45.75,
  longitude: 4.85,
  count: 0,
  reported: 0,
  in_progress: 0,
  resolved: 0,
  ...parts,
});

const [DENSE, WARM] = CLUSTER_DENSITY;

describe('clusterColor', () => {
  describe('statut majoritaire en deçà du seuil de densité', () => {
    it('suit la majorité et non un ordre de priorité', () => {
      // L'ancienne règle renvoyait « en cours » dès qu'il y en avait un seul
      const c = cluster({ count: 11, reported: 10, in_progress: 1 });
      expect(clusterColor(c)).toBe(MAP_STATUS_COLOR.reported);
    });

    it('renvoie « en cours » quand ce statut domine', () => {
      const c = cluster({ count: 9, reported: 2, in_progress: 6, resolved: 1 });
      expect(clusterColor(c)).toBe(MAP_STATUS_COLOR.in_progress);
    });

    it('renvoie « résolu » quand tout est résolu', () => {
      expect(clusterColor(cluster({ count: 4, resolved: 4 }))).toBe(MAP_STATUS_COLOR.resolved);
    });

    it('à égalité, le statut le moins avancé l’emporte', () => {
      const c = cluster({ count: 4, reported: 2, in_progress: 2 });
      expect(clusterColor(c)).toBe(MAP_STATUS_COLOR.reported);
    });
  });

  describe('bascule sur la densité', () => {
    it('passe au rouge au seuil d’alerte', () => {
      const c = cluster({ count: WARM.min, resolved: WARM.min });
      expect(clusterColor(c)).toBe(WARM.color);
    });

    it('reste sur le statut juste en dessous du seuil', () => {
      const c = cluster({ count: WARM.min - 1, resolved: WARM.min - 1 });
      expect(clusterColor(c)).toBe(MAP_STATUS_COLOR.resolved);
    });

    it('passe au rouge foncé au palier le plus dense', () => {
      const c = cluster({ count: DENSE.min, reported: DENSE.min });
      expect(clusterColor(c)).toBe(DENSE.color);
    });

    it('la densité prime sur le statut majoritaire', () => {
      const c = cluster({ count: 50, reported: 50 });
      expect(clusterColor(c)).not.toBe(MAP_STATUS_COLOR.reported);
    });
  });

  it('les teintes de densité restent hors de la palette des statuts', () => {
    const statuses = Object.values(STATUS_COLOR).map((c) => c.toLowerCase());
    CLUSTER_DENSITY.forEach((tier) => {
      expect(statuses).not.toContain(tier.color.toLowerCase());
    });
  });

  // Le résolu est volontairement atténué sur la carte pour ne pas attirer
  // l'œil sur ce qui est déjà réglé ; ailleurs il garde sa couleur franche.
  it('atténue le résolu sur la carte, pas ailleurs', () => {
    expect(MAP_STATUS_COLOR.resolved).not.toBe(STATUS_COLOR.resolved);
    expect(MAP_STATUS_COLOR.reported).toBe(STATUS_COLOR.reported);
    expect(MAP_STATUS_COLOR.in_progress).toBe(STATUS_COLOR.in_progress);
  });
});
