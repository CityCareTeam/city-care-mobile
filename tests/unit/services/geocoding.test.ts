import { searchPlaces } from '@/services/geocoding';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function respond(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) } as Response;
}

const LYON = { latitude: 45.758, longitude: 4.835 };

const result = {
  display_name: 'Rue Garibaldi, Lyon 3e Arrondissement, Lyon, France',
  lat: '45.7546',
  lon: '4.8536',
};

beforeEach(() => mockFetch.mockReset());

function calledUrl(): string {
  return decodeURIComponent(mockFetch.mock.calls[0][0] as string);
}

describe('searchPlaces', () => {
  it('rend un libellé et des coordonnées utilisables', async () => {
    mockFetch.mockResolvedValueOnce(respond([result]));
    const [place] = await searchPlaces('Garibaldi');

    expect(place.label).toContain('Rue Garibaldi');
    expect(place.latitude).toBeCloseTo(45.7546);
    expect(place.longitude).toBeCloseTo(4.8536);
  });

  /**
   * La politique d'usage de Nominatim exige cet en-tête, et le service finit
   * par refuser de répondre sans lui. C'est la raison d'être de ce module :
   * l'oubli était facile quand chaque écran écrivait son propre appel.
   */
  it('s’identifie auprès du service', async () => {
    mockFetch.mockResolvedValueOnce(respond([]));
    await searchPlaces('Garibaldi');

    const options = mockFetch.mock.calls[0][1] as RequestInit;
    expect((options.headers as Record<string, string>)['User-Agent']).toContain('CityCare');
  });

  /**
   * `viewbox` sans `bounded` : « Garibaldi » depuis Lyon doit proposer la rue
   * avant une place italienne, mais chercher une ville lointaine doit rester
   * possible. Trier, pas exclure.
   */
  it('privilégie les environs sans les imposer', async () => {
    mockFetch.mockResolvedValueOnce(respond([]));
    await searchPlaces('Garibaldi', LYON);

    const url = calledUrl();
    expect(url).toContain('viewbox=');
    expect(url).not.toContain('bounded');
  });

  it('n’envoie pas de cadre quand on ne lui donne pas de repère', async () => {
    mockFetch.mockResolvedValueOnce(respond([]));
    await searchPlaces('Garibaldi');

    expect(calledUrl()).not.toContain('viewbox');
  });

  // Un résultat sans coordonnées lisibles ne déplacerait pas la carte : le
  // proposer serait un choix sans effet.
  it('écarte les résultats inexploitables', async () => {
    mockFetch.mockResolvedValueOnce(
      respond([
        result,
        { display_name: 'Sans coordonnées' },
        { lat: '1', lon: '2' },
        { ...result, lat: 'pas un nombre' },
      ]),
    );

    expect(await searchPlaces('Garibaldi')).toHaveLength(1);
  });

  it('remonte une erreur du service', async () => {
    mockFetch.mockResolvedValueOnce(respond([], 429));
    await expect(searchPlaces('Garibaldi')).rejects.toThrow('429');
  });

  // Nominatim rend parfois un objet d'erreur au lieu d'un tableau.
  it('survit à une réponse qui n’est pas une liste', async () => {
    mockFetch.mockResolvedValueOnce(respond({ error: 'Unable to geocode' }));
    expect(await searchPlaces('Garibaldi')).toEqual([]);
  });
});
