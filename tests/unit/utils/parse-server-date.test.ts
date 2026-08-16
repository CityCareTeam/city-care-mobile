import { parseServerDate, timeAgo } from '@/utils/format-date';

/**
 * Le symptôme rapporté : une notification reçue à l'instant annoncée « il y a
 * 3 h » depuis un téléphone réglé sur un autre fuseau. La cause de cette famille
 * de bugs est toujours la même — un horodatage sans fuseau, que JavaScript lit
 * comme une heure locale.
 */
describe('parseServerDate', () => {
  it('respecte un fuseau explicite', () => {
    expect(parseServerDate('2026-08-16T22:00:00+02:00').toISOString()).toBe(
      '2026-08-16T20:00:00.000Z',
    );
    expect(parseServerDate('2026-08-16T20:00:00Z').toISOString()).toBe(
      '2026-08-16T20:00:00.000Z',
    );
  });

  // Ce que fait réellement le serveur : il écrit de l'UTC.
  it('lit une date sans fuseau comme de l’UTC', () => {
    expect(parseServerDate('2026-08-16T20:00:00').toISOString()).toBe(
      '2026-08-16T20:00:00.000Z',
    );
  });

  it('accepte les fractions de seconde du back', () => {
    expect(parseServerDate('2026-08-16T18:54:37.109495+02:00').getTime()).toBe(
      Date.parse('2026-08-16T16:54:37.109Z'),
    );
    expect(parseServerDate('2026-08-16T18:54:37.109').toISOString()).toBe(
      '2026-08-16T18:54:37.109Z',
    );
  });

  it('accepte un décalage sans deux-points', () => {
    expect(parseServerDate('2026-08-16T22:00:00+0200').toISOString()).toBe(
      '2026-08-16T20:00:00.000Z',
    );
  });

  it('rend une date invalide pour une chaîne illisible', () => {
    expect(Number.isNaN(parseServerDate('pas une date').getTime())).toBe(true);
  });
});

describe('timeAgo', () => {
  // Le cœur du problème : quel que soit le fuseau de l'appareil, un instant
  // reçu il y a une minute doit se lire « à l'instant ».
  it('ne dépend pas du fuseau de l’appareil', () => {
    const now = new Date('2026-08-16T20:00:00Z');
    jest.useFakeTimers().setSystemTime(now);

    expect(timeAgo('2026-08-16T22:00:00+02:00')).toBe("À l'instant");
    expect(timeAgo('2026-08-16T20:00:00Z')).toBe("À l'instant");
    expect(timeAgo('2026-08-16T20:00:00')).toBe("À l'instant");

    jest.useRealTimers();
  });

  it('compte les heures depuis l’instant, pas depuis l’heure affichée', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-16T20:00:00Z'));
    expect(timeAgo('2026-08-16T17:00:00Z')).toBe('Il y a 3h');
    jest.useRealTimers();
  });
});
