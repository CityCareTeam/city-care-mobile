import { getNews } from '@/services/news';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function respond(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) } as Response;
}

// Forme réellement renvoyée par l'agrégation Opendatasoft des événements
// publics OpenAgenda, relevée sur un enregistrement du Bugey.
const record = {
  uid: '68533709',
  title_fr: 'Création entreprise',
  description_fr: 'Ateliers-conseils : les étapes de la création d’entreprise.',
  daterange_fr: 'Lundi 17 août, 09h00',
  firstdate_begin: '2026-08-17T07:00:00+00:00',
  location_name: 'France Travail Belley',
  location_city: 'Belley',
  thumbnail: 'https://img.openagenda.com/main/017e.thumb.image.jpg',
  image: 'https://img.openagenda.com/main/017e.base.image.jpg',
};

const PLATEAU = { latitude: 45.9298, longitude: 5.5744 };

beforeEach(() => mockFetch.mockReset());

function lastUrl(): string {
  return decodeURIComponent(mockFetch.mock.calls[0][0] as string);
}

describe('getNews', () => {
  /**
   * Le cœur du service : on interroge un rayon autour d'un point, pas un
   * agenda. C'est ce qui rend une commune de trois mille sept cents habitants
   * couvrable au même titre qu'une métropole.
   */
  it('cherche dans un rayon autour du point demandé', async () => {
    mockFetch.mockResolvedValueOnce(respond({ results: [] }));
    await getNews(PLATEAU, 25);

    const url = lastUrl();
    expect(url).toContain('evenements-publics-openagenda');
    expect(url).toContain("GEOM'POINT(5.57440 45.92980)'");
    expect(url).toContain('25km');
  });

  // Une liste dont les cinq premières dates sont passées a l'air cassée : le
  // jeu garde les événements tant qu'ils courent, on ne veut que ce qui vient.
  it('n’accepte que ce qui commence à partir de maintenant, au plus proche d’abord', async () => {
    mockFetch.mockResolvedValueOnce(respond({ results: [] }));
    await getNews(PLATEAU, 25);

    const url = lastUrl();
    expect(url).toMatch(/firstdate_begin>='\d{4}-\d{2}-\d{2}T/);
    expect(url).toContain('order_by=firstdate_begin');
  });

  /**
   * France Travail épingle ses ateliers et ses visioconférences nationales à
   * l'adresse de l'agence la plus proche : 54 % des événements à venir autour
   * du Plateau d'Hauteville. Sans cette exclusion, l'écran affiche un
   * calendrier d'agence pour l'emploi au lieu de ce qui se passe en ville.
   */
  it('écarte les agendas qui n’ont rien à faire là', async () => {
    mockFetch.mockResolvedValueOnce(respond({ results: [] }));
    await getNews(PLATEAU, 25);

    expect(lastUrl()).toContain("NOT canonicalurl LIKE 'francetravail'");
  });

  it('rend les champs dont l’écran a besoin', async () => {
    mockFetch.mockResolvedValueOnce(respond({ results: [record] }));
    const [item] = await getNews(PLATEAU, 25);

    expect(item.id).toBe('68533709');
    expect(item.title).toBe('Création entreprise');
    expect(item.when).toBe('Lundi 17 août, 09h00');
    expect(item.startsAt).toBe('2026-08-17T07:00:00+00:00');
  });

  // « Salle des fêtes » situe mieux que « Belley » quand on est déjà à Belley.
  it('préfère le nom du lieu à celui de la commune', async () => {
    mockFetch.mockResolvedValueOnce(respond({ results: [record] }));
    expect((await getNews(PLATEAU, 25))[0].place).toBe('France Travail Belley');

    mockFetch.mockResolvedValueOnce(
      respond({ results: [{ ...record, location_name: null }] }),
    );
    expect((await getNews(PLATEAU, 25))[0].place).toBe('Belley');
  });

  // Une liste n'a pas besoin de sept cents pixels de large.
  it('prend la vignette plutôt que l’image pleine', async () => {
    mockFetch.mockResolvedValueOnce(respond({ results: [record] }));
    expect((await getNews(PLATEAU, 25))[0].imageUrl).toContain('.thumb.');

    mockFetch.mockResolvedValueOnce(respond({ results: [{ ...record, thumbnail: null }] }));
    expect((await getNews(PLATEAU, 25))[0].imageUrl).toContain('.base.');
  });

  it('débarrasse un résumé de son HTML', async () => {
    mockFetch.mockResolvedValueOnce(
      respond({ results: [{ ...record, description_fr: '<p>Une <b>fête</b>  du village</p>' }] }),
    );
    expect((await getNews(PLATEAU, 25))[0].summary).toBe('Une fête du village');
  });

  it('accepte un enregistrement sans image ni lieu', async () => {
    mockFetch.mockResolvedValueOnce(respond({ results: [{ uid: '1', title_fr: 'Sans rien' }] }));
    const [item] = await getNews(PLATEAU, 25);

    expect(item.imageUrl).toBeNull();
    expect(item.place).toBeNull();
    expect(item.title).toBe('Sans rien');
    expect(item.when).toBe('');
  });

  it('remonte une erreur du service', async () => {
    mockFetch.mockResolvedValueOnce(respond({}, 400));
    await expect(getNews(PLATEAU, 25)).rejects.toThrow('400');
  });
});
