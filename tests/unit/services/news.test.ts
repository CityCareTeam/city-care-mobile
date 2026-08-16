import { getNews } from '@/services/news';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function respond(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) } as Response;
}

// Forme réellement renvoyée par OpenAgenda, relevée sur l'agenda de la Métropole.
const event = {
  uid: 18104453,
  title: { fr: 'Diptyque de Guillaume Bottazzi', en: 'Strange diptych' },
  description: { fr: '<p>Une <b>œuvre</b> sur les Gratte-Ciel</p>' },
  dateRange: { fr: '18 - 20 septembre', en: '18 - 20 September' },
  nextTiming: { begin: '2026-09-18T08:00:00+02:00' },
  location: { name: 'Gratte-Ciel de Villeurbanne', city: 'Villeurbanne' },
  image: {
    base: 'https://img.openagenda.com/main/',
    filename: 'abc.base.image.jpg',
    variants: [
      { filename: 'abc.full.image.jpg', type: 'full' },
      { filename: 'abc.thumb.image.jpg', type: 'thumbnail' },
    ],
  },
};

beforeEach(() => mockFetch.mockReset());

describe('getNews', () => {
  it('ne demande que ce qui est à venir, au plus proche d’abord', async () => {
    mockFetch.mockResolvedValueOnce(respond({ events: [] }));
    await getNews('87532799', 'oa_pk_test', 'fr');

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/agendas/87532799/events');
    expect(url).toContain('relative[]=upcoming');
    expect(url).toContain('sort=firstTiming.asc');
  });

  it('rend les champs dont l’écran a besoin', async () => {
    mockFetch.mockResolvedValueOnce(respond({ events: [event] }));
    const [item] = await getNews('1', 'k', 'fr');

    expect(item.id).toBe('18104453');
    expect(item.title).toBe('Diptyque de Guillaume Bottazzi');
    expect(item.when).toBe('18 - 20 septembre');
    expect(item.place).toBe('Gratte-Ciel de Villeurbanne');
    expect(item.startsAt).toBe('2026-09-18T08:00:00+02:00');
  });

  it('suit la langue demandée', async () => {
    mockFetch.mockResolvedValueOnce(respond({ events: [event] }));
    expect((await getNews('1', 'k', 'en'))[0].title).toBe('Strange diptych');
  });

  // Les organisateurs ne saisissent pas toutes les langues : un titre dans la
  // mauvaise vaut mieux qu'une carte vide.
  it('retombe sur le français puis sur ce qui existe', async () => {
    mockFetch.mockResolvedValueOnce(respond({ events: [event] }));
    expect((await getNews('1', 'k', 'en'))[0].when).toBe('18 - 20 September');

    mockFetch.mockResolvedValueOnce(
      respond({ events: [{ ...event, title: { it: 'Dittico' } }] }),
    );
    expect((await getNews('1', 'k', 'fr'))[0].title).toBe('Dittico');
  });

  // Les descriptions arrivent en HTML, et un `<Text>` afficherait les balises.
  it('débarrasse la description de son HTML', async () => {
    mockFetch.mockResolvedValueOnce(respond({ events: [event] }));
    expect((await getNews('1', 'k', 'fr'))[0].summary).toBe('Une œuvre sur les Gratte-Ciel');
  });

  // Une liste n'a pas besoin de sept cents pixels de large.
  it('prend la vignette plutôt que l’image pleine', async () => {
    mockFetch.mockResolvedValueOnce(respond({ events: [event] }));
    expect((await getNews('1', 'k', 'fr'))[0].imageUrl).toBe(
      'https://img.openagenda.com/main/abc.thumb.image.jpg',
    );
  });

  it('accepte un événement sans image ni lieu', async () => {
    mockFetch.mockResolvedValueOnce(
      respond({ events: [{ uid: 1, title: { fr: 'Sans rien' } }] }),
    );
    const [item] = await getNews('1', 'k', 'fr');
    expect(item.imageUrl).toBeNull();
    expect(item.place).toBeNull();
    expect(item.title).toBe('Sans rien');
  });

  it('remonte une erreur du service', async () => {
    mockFetch.mockResolvedValueOnce(respond({}, 403));
    await expect(getNews('1', 'k', 'fr')).rejects.toThrow('403');
  });
});
