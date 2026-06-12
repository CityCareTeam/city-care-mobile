import { extractCity } from '@/utils/format-address';

describe('extractCity', () => {
  it('detects "69002 Lyon" embedded postal code format', () => {
    expect(extractCity('12 Rue de la Paix, 69002 Lyon, France')).toBe('Lyon');
  });

  it('ignores France (case insensitive) and standalone postal code', () => {
    expect(extractCity('12 Rue de la Paix, Lyon, 69001, France')).toBe('Lyon');
  });

  it('ignores France at end, city before postal code', () => {
    expect(extractCity('Rue A, 69002, Villeurbanne, France')).toBe('Villeurbanne');
  });

  it('filters out region with multiple hyphens (Auvergne-Rhône-Alpes)', () => {
    expect(extractCity('Rue de la Paix, Lyon, Métropole de Lyon, Auvergne-Rhône-Alpes, France')).toBe('Lyon');
  });

  it('filters out Métropole suffix', () => {
    expect(extractCity('Place Jules Ferry, Lyon, Métropole de Lyon, France')).toBe('Lyon');
  });

  it('filters out "France métropolitaine" (starts-with france)', () => {
    expect(extractCity('Place Jules Ferry, Lyon, Auvergne-Rhône-Alpes, France métropolitaine')).toBe('Lyon');
  });

  it('picks city before département (Nominatim format: street, city, dept, region, postal, country)', () => {
    expect(extractCity('42 Avenue des Frères Lumière, Lyon, Rhône, Auvergne-Rhône-Alpes, 69003, France métropolitaine')).toBe('Lyon');
  });

  it('filters street parts (Avenue) to avoid returning street as city', () => {
    expect(extractCity('Avenue Jean Jaurès, Grenoble, Isère, Auvergne-Rhône-Alpes, France')).toBe('Grenoble');
  });

  it('filters street type "Montée" (unconventional voie)', () => {
    expect(extractCity('Montée de la Boucle, Lyon, Rhône, Auvergne-Rhône-Alpes, 69005, France')).toBe('Lyon');
  });

  it('filters département name "Rhône" (single-word dept without hyphens)', () => {
    expect(extractCity('Rue Garibaldi, Lyon, Rhône, 69003, France')).toBe('Lyon');
  });

  it('skips neighborhood (Cordeliers) to find city via Métropole/Arrondissement hint', () => {
    expect(extractCity(
      '18 bis, Rue de la République, Cordeliers, Lyon 2e Arrondissement, Lyon, Métropole de Lyon, Rhône, Auvergne-Rhône-Alpes, France métropolitaine, 69002, France'
    )).toBe('Lyon');
  });

  it('returns the address itself when no comma', () => {
    expect(extractCity('Lyon')).toBe('Lyon');
  });

  it('returns fallback when address is null', () => {
    expect(extractCity(null)).toBe('Localisation inconnue');
  });

  it('returns fallback when address is undefined', () => {
    expect(extractCity(undefined)).toBe('Localisation inconnue');
  });

  it('returns fallback when address is empty string', () => {
    expect(extractCity('')).toBe('Localisation inconnue');
  });
});
