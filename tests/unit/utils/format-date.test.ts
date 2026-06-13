import { formatIncidentDateTime, formatDate, formatDateShort, timeAgo } from '@/utils/format-date';

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

describe('timeAgo', () => {
  const NOW = new Date('2025-06-13T12:00:00Z').getTime();
  let dateSpy: jest.SpyInstance;

  beforeEach(() => { dateSpy = jest.spyOn(Date, 'now').mockReturnValue(NOW); });
  afterEach(() => dateSpy.mockRestore());

  it('returns "À l\'instant" for < 1 minute ago', () => {
    const date = new Date(NOW - 30_000).toISOString();
    expect(timeAgo(date)).toBe("À l'instant");
  });

  it('returns "Il y a X min" for minutes ago', () => {
    const date = new Date(NOW - 5 * 60_000).toISOString();
    expect(timeAgo(date)).toBe('Il y a 5 min');
  });

  it('returns "Il y a Xh" for hours ago', () => {
    const date = new Date(NOW - 3 * 3_600_000).toISOString();
    expect(timeAgo(date)).toBe('Il y a 3h');
  });

  it('returns "Hier" for exactly 1 day ago', () => {
    const date = new Date(NOW - 24 * 3_600_000).toISOString();
    expect(timeAgo(date)).toBe('Hier');
  });

  it('returns "Il y a X jours" for 2–6 days ago', () => {
    const date = new Date(NOW - 3 * 86_400_000).toISOString();
    expect(timeAgo(date)).toBe('Il y a 3 jours');
  });

  it('returns a formatted date for >= 7 days ago', () => {
    const date = new Date(NOW - 10 * 86_400_000).toISOString();
    const result = timeAgo(date);
    expect(result).toContain('juin');
    expect(result).not.toContain('Il y a');
  });
});
