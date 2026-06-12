import { formatIncidentDateTime, formatDate, formatDateShort } from '@/utils/format-date';

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
