import { dayBucket } from '@/utils/format-date';

// Un mercredi à 14 h, pour que « hier » et « aujourd'hui » soient sans ambiguïté.
const now = new Date(2026, 7, 12, 14, 0, 0);

const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 7, day, hour, minute).toISOString();

describe('dayBucket', () => {
  it('range ce qui est arrivé aujourd’hui', () => {
    expect(dayBucket(at(12, 9), now)).toBe('today');
    expect(dayBucket(at(12, 0, 1), now)).toBe('today');
  });

  it('range la veille dans « hier »', () => {
    expect(dayBucket(at(11, 23), now)).toBe('yesterday');
    expect(dayBucket(at(11, 0, 5), now)).toBe('yesterday');
  });

  it('range le reste dans « plus tôt »', () => {
    expect(dayBucket(at(10, 23, 59), now)).toBe('earlier');
    expect(dayBucket(at(1, 12), now)).toBe('earlier');
  });

  // Le point de la comparaison : c'est le jour civil qui compte, pas l'écart
  // d'heures. Reçue à 23 h 50, une notification est d'hier à 0 h 10 — et c'est
  // bien comme ça qu'on la cherche dans la liste.
  it('compare des jours, pas des durées', () => {
    const justAfterMidnight = new Date(2026, 7, 12, 0, 10);
    expect(dayBucket(at(11, 23, 50), justAfterMidnight)).toBe('yesterday');
  });

  it('ne se laisse pas surprendre par une date illisible', () => {
    expect(dayBucket('pas une date', now)).toBe('earlier');
  });
});
