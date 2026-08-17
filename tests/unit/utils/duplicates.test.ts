import type { IncidentResponse } from '@/types/incidents';
import { findDuplicates, metersBetween } from '@/utils/duplicates';

const HERE = { latitude: 45.758, longitude: 4.835 };

/** Décalage en latitude correspondant à peu près à `meters` mètres. */
function north(meters: number) {
  return { latitude: HERE.latitude + meters / 111_000, longitude: HERE.longitude };
}

function incident(over: Partial<IncidentResponse>): IncidentResponse {
  return {
    id: over.id ?? '1',
    type: 'Road',
    status: 'reported',
    description: '',
    ...HERE,
    ...over,
  } as IncidentResponse;
}

describe('findDuplicates', () => {
  it('retient un signalement du même type juste à côté', () => {
    const found = findDuplicates([incident({ id: 'proche', ...north(20) })], HERE, 'Road');
    expect(found.map((i) => i.id)).toEqual(['proche']);
  });

  it('écarte ce qui est trop loin', () => {
    expect(findDuplicates([incident({ ...north(200) })], HERE, 'Road')).toHaveLength(0);
  });

  it('écarte un autre type au même endroit', () => {
    expect(findDuplicates([incident({ type: 'Lighting' })], HERE, 'Road')).toHaveLength(0);
  });

  /**
   * Un trou rebouché puis rouvert est un nouveau problème, pas un doublon.
   * Confondre les deux découragerait un signalement légitime.
   */
  it('écarte un signalement résolu', () => {
    expect(findDuplicates([incident({ status: 'resolved' })], HERE, 'Road')).toHaveLength(0);
    expect(findDuplicates([incident({ status: 'in_progress' })], HERE, 'Road')).toHaveLength(1);
  });

  it('ne dit rien tant qu’aucune catégorie n’est choisie', () => {
    expect(findDuplicates([incident({})], HERE, null)).toHaveLength(0);
  });

  // Le plus proche en tête : c'est celui que la carte propose d'ouvrir.
  it('classe du plus proche au plus lointain', () => {
    const found = findDuplicates(
      [
        incident({ id: 'loin', ...north(45) }),
        incident({ id: 'proche', ...north(5) }),
        incident({ id: 'milieu', ...north(25) }),
      ],
      HERE,
      'Road',
    );
    expect(found.map((i) => i.id)).toEqual(['proche', 'milieu', 'loin']);
  });

  it('accepte un rayon donné', () => {
    expect(findDuplicates([incident({ ...north(120) })], HERE, 'Road', 150)).toHaveLength(1);
  });
});

describe('metersBetween', () => {
  // Personne n'estime « 37 mètres » : au-delà de dix, on arrondit à cinq.
  it('arrondit à ce qu’un piéton sait estimer', () => {
    expect(metersBetween(HERE, north(37))).toBe(35);
    expect(metersBetween(HERE, north(4))).toBe(4);
  });
});
