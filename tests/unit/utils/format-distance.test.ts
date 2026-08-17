import { formatDistance } from '@/utils/format-distance';

describe('formatDistance', () => {
  /**
   * Le GPS d'un téléphone en ville se trompe de plus de dix mètres : afficher
   * « 347 m » serait une illusion de précision.
   */
  it('arrondit les mètres à la dizaine', () => {
    expect(formatDistance(0.347)).toBe('350 m');
    expect(formatDistance(0.12)).toBe('120 m');
  });

  // Sur place, mieux vaut « 10 m » qu'un zéro qui se lirait comme une panne.
  it('ne descend pas sous dix mètres', () => {
    expect(formatDistance(0.002)).toBe('10 m');
    expect(formatDistance(0)).toBe('10 m');
  });

  // L'écart entre 1,2 et 1,8 km décide si l'on y va à pied.
  it('garde une décimale sous dix kilomètres', () => {
    expect(formatDistance(1.24)).toBe('1,2 km');
    expect(formatDistance(9.98)).toBe('10,0 km');
  });

  it('passe à l’entier au-delà', () => {
    expect(formatDistance(12.4)).toBe('12 km');
    expect(formatDistance(310.7)).toBe('311 km');
  });

  it('suit la langue pour le séparateur décimal', () => {
    expect(formatDistance(1.24, 'en-GB')).toBe('1.2 km');
  });

  // Une coordonnée manquante donne NaN : mieux vaut ne rien dire.
  it('ne rend rien sur une distance qui n’en est pas une', () => {
    expect(formatDistance(NaN)).toBe('');
    expect(formatDistance(-3)).toBe('');
  });
});
