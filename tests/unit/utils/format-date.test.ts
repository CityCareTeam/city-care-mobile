import { formatIncidentDateTime, formatDate, formatDateShort, extractCity } from '@/utils/format-date';

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

describe('formatDateShort', () => {
  it('formats a date as DD/MM/YYYY', () => {
    expect(formatDateShort('2025-06-11T10:30:00Z')).toBe('11/06/2025');
  });

  it('handles first day of year', () => {
    expect(formatDateShort('2025-01-01T00:00:00Z')).toBe('01/01/2025');
  });

  it('handles last day of year', () => {
    expect(formatDateShort('2025-12-31T12:00:00Z')).toBe('31/12/2025');
  });
});

describe('formatDate', () => {
  it('formats a date with full month name in French', () => {
    const result = formatDate('2025-01-15T00:00:00Z');
    expect(result).toContain('janvier');
    expect(result).toContain('2025');
  });

  it('contains the day number', () => {
    const result = formatDate('2025-06-11T00:00:00Z');
    expect(result).toContain('11');
    expect(result).toContain('juin');
  });
});

describe('formatIncidentDateTime', () => {
  it('includes the date and time', () => {
    const result = formatIncidentDateTime('2025-06-11T14:30:00Z');
    expect(result).toContain('2025');
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it('includes the month name in French', () => {
    const result = formatIncidentDateTime('2025-03-01T00:00:00Z');
    expect(result).toContain('mars');
  });

  it('returns a non-empty string for any valid date', () => {
    expect(formatIncidentDateTime('2020-01-01T00:00:00Z').length).toBeGreaterThan(0);
  });
});
