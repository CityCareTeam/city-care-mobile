import {
  decideOnFlag,
  flagContent,
  FLAG_REASONS,
  getModerationQueue,
  MODERATION_UNAVAILABLE,
} from '@/services/moderation';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function respond(status: number, body: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response;
}

beforeEach(() => mockFetch.mockReset());

describe('signaler un contenu', () => {
  it('envoie la cible et le motif', async () => {
    mockFetch.mockResolvedValueOnce(respond(201));
    await flagContent('incident', 'abc', 'hateful', 'jeton');

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/moderation/flags');
    expect(JSON.parse(options.body as string)).toEqual({
      targetType: 'incident',
      targetId: 'abc',
      reason: 'hateful',
    });
  });

  /**
   * Le cœur de ce module. Tant que le back ne connaît pas la route, l'écran doit
   * pouvoir dire « masqué chez vous, modérateurs pas joignables » — un endpoint
   * absent n'est pas une panne, et l'afficher comme telle enverrait chercher un
   * problème là où il n'y en a pas.
   */
  it('distingue une route absente d’une vraie erreur', async () => {
    mockFetch.mockResolvedValueOnce(respond(404));
    await expect(flagContent('incident', 'a', 'other', 'j')).rejects.toThrow(MODERATION_UNAVAILABLE);

    mockFetch.mockResolvedValueOnce(respond(501));
    await expect(flagContent('incident', 'a', 'other', 'j')).rejects.toThrow(MODERATION_UNAVAILABLE);

    mockFetch.mockResolvedValueOnce(respond(500));
    await expect(flagContent('incident', 'a', 'other', 'j')).rejects.toThrow('500');
  });

  // Déjà signalé par cette personne : son geste a porté la première fois, le
  // lui présenter comme un échec serait faux.
  it('accepte un doublon sans le traiter comme un échec', async () => {
    mockFetch.mockResolvedValueOnce(respond(409));
    await expect(flagContent('message', 'm1', 'off_topic', 'j')).resolves.toBeUndefined();
  });

  // Les motifs reprennent un pour un les interdits des conditions d'utilisation.
  it('propose les six motifs des conditions', () => {
    expect(FLAG_REASONS).toEqual([
      'hateful',
      'personal_data',
      'off_topic',
      'false_report',
      'advertising',
      'other',
    ]);
  });
});

describe('file de modération', () => {
  it('rend la liste du serveur', async () => {
    mockFetch.mockResolvedValueOnce(respond(200, [{ id: '1', count: 3 }]));
    expect(await getModerationQueue('jeton')).toHaveLength(1);
  });

  it('survit à une réponse qui n’est pas une liste', async () => {
    mockFetch.mockResolvedValueOnce(respond(200, { error: 'nope' }));
    expect(await getModerationQueue('jeton')).toEqual([]);
  });

  it('signale une route absente', async () => {
    mockFetch.mockResolvedValueOnce(respond(404));
    await expect(getModerationQueue('jeton')).rejects.toThrow(MODERATION_UNAVAILABLE);
  });
});

describe('trancher', () => {
  // « Garder » n'est pas une non-décision : elle passe par la même route et doit
  // laisser une trace au même titre que « masquer ».
  it('appelle la route de la décision prise', async () => {
    mockFetch.mockResolvedValueOnce(respond(204));
    await decideOnFlag('f1', 'keep', 'jeton', 'rien à retirer');

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/moderation/queue/f1/keep');
    expect(JSON.parse(options.body as string)).toEqual({ comment: 'rien à retirer' });
  });

  it('signale une route absente', async () => {
    mockFetch.mockResolvedValueOnce(respond(404));
    await expect(decideOnFlag('f1', 'hide', 'jeton')).rejects.toThrow(MODERATION_UNAVAILABLE);
  });
});
