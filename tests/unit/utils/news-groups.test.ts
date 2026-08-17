import { fr } from '@/constants/i18n/fr';
import type { NewsItem } from '@/services/news';
import { groupByPeriod } from '@/utils/news-groups';

// Un lundi, en milieu d'après-midi.
const NOW = new Date(2026, 7, 17, 15, 0, 0);

function event(id: string, startsAt: string | null): NewsItem {
  return { id, title: id, summary: '', when: '', place: null, imageUrl: null, startsAt, url: null };
}

function day(offset: number, hour = 10) {
  return new Date(2026, 7, 17 + offset, hour).toISOString();
}

describe('groupByPeriod', () => {
  it('range chaque événement dans sa tranche', () => {
    const sections = groupByPeriod(
      [
        event('ce-soir', day(0, 20)),
        event('jeudi', day(3)),
        event('dans-deux-semaines', day(14)),
        event('en-novembre', day(80)),
      ],
      fr,
      NOW,
    );

    expect(sections.map((s) => [s.title, s.data.map((i) => i.id)])).toEqual([
      [fr.news.today, ['ce-soir']],
      [fr.news.thisWeek, ['jeudi']],
      [fr.news.thisMonth, ['dans-deux-semaines']],
      [fr.news.later, ['en-novembre']],
    ]);
  });

  /**
   * Un intertitre qui ne coiffe rien fait croire à un chargement inachevé.
   */
  it('n’affiche pas de section vide', () => {
    const sections = groupByPeriod([event('jeudi', day(3))], fr, NOW);

    expect(sections).toHaveLength(1);
    expect(sections[0].period).toBe('week');
  });

  // La source garde les événements en cours : ils appartiennent à aujourd'hui,
  // pas à une catégorie « passé » qui n'existe pas ici.
  it('met un événement commencé plus tôt avec ceux du jour', () => {
    const sections = groupByPeriod([event('expo', day(-30))], fr, NOW);
    expect(sections[0].period).toBe('today');
  });

  it('met à part ce qu’il ne sait pas dater, sans le perdre', () => {
    const sections = groupByPeriod([event('sans-date', null), event('demain', day(1))], fr, NOW);

    expect(sections.map((s) => s.period)).toEqual(['week', 'undated']);
    expect(sections[1].data).toHaveLength(1);
  });

  it('ne perd aucun événement au passage', () => {
    const items = [event('a', day(0)), event('b', day(4)), event('c', day(20)), event('d', null)];
    const total = groupByPeriod(items, fr, NOW).reduce((n, s) => n + s.data.length, 0);

    expect(total).toBe(items.length);
  });

  it('rend une liste vide sur une liste vide', () => {
    expect(groupByPeriod([], fr, NOW)).toEqual([]);
  });
});
