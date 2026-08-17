import type { IncidentResponse } from '@/types/incidents';
import {
  MAX_PER_ROUND,
  QUIET_FROM,
  QUIET_UNTIL,
  alertableIncidents,
  isQuietHour,
} from '@/utils/nearby';

const HERE = { latitude: 45.758, longitude: 4.835 };
const NOW = new Date('2026-08-17T15:00:00+02:00');

function north(meters: number) {
  return { latitude: HERE.latitude + meters / 111_000, longitude: HERE.longitude };
}

function incident(over: Partial<IncidentResponse> = {}): IncidentResponse {
  return {
    id: '1',
    type: 'Road',
    status: 'reported',
    description: '',
    createdAt: new Date(NOW.getTime() - 30 * 60_000).toISOString(),
    ...HERE,
    ...over,
  } as IncidentResponse;
}

function found(incidents: IncidentResponse[], over: Partial<Parameters<typeof alertableIncidents>[1]> = {}) {
  return alertableIncidents(incidents, {
    origin: HERE,
    radiusKm: 1,
    announced: new Set<string>(),
    now: NOW,
    ...over,
  });
}

describe('alertableIncidents', () => {
  it('retient un signalement récent et proche', () => {
    expect(found([incident({ id: 'proche', ...north(300) })]).map((i) => i.id)).toEqual(['proche']);
  });

  it('écarte ce qui est hors du rayon', () => {
    expect(found([incident({ ...north(2000) })])).toHaveLength(0);
  });

  /**
   * La borne la plus importante. Sans elle, la première ouverture de
   * l'application aurait annoncé tout le quartier d'un coup — et personne ne
   * rallume ce genre de réglage deux fois.
   */
  it('écarte ce qui n’est plus une nouvelle', () => {
    const old = new Date(NOW.getTime() - 8 * 3600_000).toISOString();
    expect(found([incident({ createdAt: old })])).toHaveLength(0);
  });

  it('écarte ce dont on a déjà prévenu', () => {
    expect(found([incident({ id: 'vu' })], { announced: new Set(['vu']) })).toHaveLength(0);
  });

  it('écarte les résolus et les siens', () => {
    expect(found([incident({ status: 'resolved' })])).toHaveLength(0);
    expect(
      found([incident({ authorUserId: 'moi' } as Partial<IncidentResponse>)], { selfId: 'moi' }),
    ).toHaveLength(0);
  });

  /**
   * Une rue qu'on vient de repeindre produit dix signalements en une heure. Dix
   * notifications d'affilée se lisent comme une panne.
   */
  it('n’en annonce jamais plus de trois d’un coup', () => {
    const many = Array.from({ length: 9 }, (_, i) =>
      incident({ id: `n${i}`, ...north(100 + i * 20) }),
    );
    expect(found(many)).toHaveLength(MAX_PER_ROUND);
  });

  it('donne le plus proche en premier', () => {
    const list = [
      incident({ id: 'loin', ...north(800) }),
      incident({ id: 'proche', ...north(50) }),
      incident({ id: 'milieu', ...north(400) }),
    ];
    expect(found(list).map((i) => i.id)).toEqual(['proche', 'milieu', 'loin']);
  });

  it('ignore une date illisible plutôt que de la croire récente', () => {
    expect(found([incident({ createdAt: 'pas une date' })])).toHaveLength(0);
  });
});

describe('isQuietHour', () => {
  // Un nid-de-poule signalé à trois heures du matin n'a réveillé personne
  // d'utile.
  it('se tait la nuit', () => {
    expect(isQuietHour(new Date(2026, 7, 17, QUIET_FROM))).toBe(true);
    expect(isQuietHour(new Date(2026, 7, 17, 3))).toBe(true);
    expect(isQuietHour(new Date(2026, 7, 17, QUIET_UNTIL - 1))).toBe(true);
  });

  it('parle le jour', () => {
    expect(isQuietHour(new Date(2026, 7, 17, QUIET_UNTIL))).toBe(false);
    expect(isQuietHour(new Date(2026, 7, 17, 15))).toBe(false);
    expect(isQuietHour(new Date(2026, 7, 17, QUIET_FROM - 1))).toBe(false);
  });
});
