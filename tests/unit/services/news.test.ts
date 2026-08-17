import type { NewsCity } from '@/constants/news-cities';
import { getNews, type NewsItem } from '@/services/news';
import { getOpenAgendaEvents } from '@/services/news-openagenda';
import { getTourismEvents } from '@/services/news-tourism';

jest.mock('@/services/news-openagenda', () => ({ getOpenAgendaEvents: jest.fn() }));
jest.mock('@/services/news-tourism', () => ({ getTourismEvents: jest.fn() }));

const national = getOpenAgendaEvents as jest.Mock;
const tourism = getTourismEvents as jest.Mock;

function item(title: string, startsAt: string | null): NewsItem {
  return { id: title, title, summary: '', when: '', place: null, imageUrl: null, startsAt };
}

const PLATEAU: NewsCity = {
  id: 'plateau-hauteville',
  name: 'Plateau d’Hauteville',
  latitude: 45.9298,
  longitude: 5.5744,
  sources: [
    { kind: 'page', url: 'https://example.test/agenda/', label: 'Office de tourisme' },
    { kind: 'openagenda', radiusKm: 15 },
  ],
};

beforeEach(() => {
  national.mockReset();
  tourism.mockReset();
});

describe('getNews', () => {
  /**
   * La raison d'être de la fusion : l'agrégation nationale ne connaît qu'un
   * événement sur la commune, l'office de tourisme en publie vingt-quatre.
   * Séparément, aucune des deux ne fait l'écran qu'on veut.
   */
  it('fond les sources d’un lieu dans un seul ordre chronologique', async () => {
    tourism.mockResolvedValueOnce([item('Marché', '2026-09-10T00:00:00.000Z')]);
    national.mockResolvedValueOnce([
      item('Concert', '2026-09-01T00:00:00.000Z'),
      item('Visite', '2026-09-20T00:00:00.000Z'),
    ]);

    const news = await getNews(PLATEAU);
    expect(news.map((n) => n.title)).toEqual(['Concert', 'Marché', 'Visite']);
  });

  it('interroge chaque source avec ce qui la concerne', async () => {
    tourism.mockResolvedValueOnce([item('Marché', null)]);
    national.mockResolvedValueOnce([]);

    await getNews(PLATEAU);
    expect(tourism).toHaveBeenCalledWith('https://example.test/agenda/');
    expect(national).toHaveBeenCalledWith(PLATEAU, 15);
  });

  // Un même événement publié des deux côtés ne doit faire qu'une carte.
  it('ne garde qu’un exemplaire d’un événement présent partout', async () => {
    tourism.mockResolvedValueOnce([item('Marché', '2026-09-10T00:00:00.000Z')]);
    national.mockResolvedValueOnce([item('  marché ', '2026-09-10T00:00:00.000Z')]);

    const news = await getNews(PLATEAU);
    expect(news).toHaveLength(1);
    // Celui de la première source, la plus locale.
    expect(news[0].title).toBe('Marché');
  });

  /**
   * Lire la page d'un tiers, c'est accepter qu'elle change. Ce jour-là l'écran
   * doit perdre le marché du mercredi, pas tout le reste.
   */
  it('rend ce qui a répondu quand une source tombe', async () => {
    tourism.mockRejectedValueOnce(new Error('la page a changé de forme'));
    national.mockResolvedValueOnce([item('Concert', '2026-09-01T00:00:00.000Z')]);

    expect((await getNews(PLATEAU)).map((n) => n.title)).toEqual(['Concert']);
  });

  it('ne lève que si toutes les sources tombent', async () => {
    tourism.mockRejectedValueOnce(new Error('page illisible'));
    national.mockRejectedValueOnce(new Error('réseau'));

    await expect(getNews(PLATEAU)).rejects.toThrow('page illisible');
  });

  // Sans date, un événement existe : on ne sait juste pas le situer.
  it('renvoie les événements sans date en fin de liste', async () => {
    tourism.mockResolvedValueOnce([item('Toute l’année', null)]);
    national.mockResolvedValueOnce([item('Concert', '2026-09-01T00:00:00.000Z')]);

    expect((await getNews(PLATEAU)).map((n) => n.title)).toEqual(['Concert', 'Toute l’année']);
  });
});
