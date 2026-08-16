import { getCurrentWeather } from '@/services/weather';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function respond(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

// Forme réellement renvoyée par Open-Meteo, relevée sur l'API.
const payload = {
  current: { time: '2026-08-16T20:15', temperature_2m: 26.9, weather_code: 3, is_day: 0 },
};

beforeEach(() => mockFetch.mockReset());

describe('getCurrentWeather', () => {
  it('demande les trois champs utiles à la bonne position', async () => {
    mockFetch.mockResolvedValueOnce(respond(payload));
    await getCurrentWeather(45.748, 4.847);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('latitude=45.748');
    expect(url).toContain('longitude=4.847');
    expect(url).toContain('current=temperature_2m,weather_code,is_day');
  });

  it('traduit le code WMO en condition', async () => {
    mockFetch.mockResolvedValueOnce(respond(payload));
    const weather = await getCurrentWeather(45.748, 4.847);
    expect(weather.condition).toBe('cloudy');
    expect(weather.temperature).toBe(26.9);
  });

  // `is_day` vaut 0 ou 1, pas un booléen.
  it('lit la nuit comme telle', async () => {
    mockFetch.mockResolvedValueOnce(respond(payload));
    expect((await getCurrentWeather(0, 0)).isDay).toBe(false);

    mockFetch.mockResolvedValueOnce(respond({ current: { ...payload.current, is_day: 1 } }));
    expect((await getCurrentWeather(0, 0)).isDay).toBe(true);
  });

  // Mieux vaut ne rien afficher qu'un « 0° » inventé à partir d'un champ absent.
  it('refuse une réponse sans température', async () => {
    mockFetch.mockResolvedValueOnce(respond({ current: { weather_code: 3 } }));
    await expect(getCurrentWeather(0, 0)).rejects.toThrow();
  });

  it('refuse une réponse sans code météo', async () => {
    mockFetch.mockResolvedValueOnce(respond({ current: { temperature_2m: 20 } }));
    await expect(getCurrentWeather(0, 0)).rejects.toThrow();
  });

  it('remonte une erreur du service', async () => {
    mockFetch.mockResolvedValueOnce(respond({}, 503));
    await expect(getCurrentWeather(0, 0)).rejects.toThrow('503');
  });
});
