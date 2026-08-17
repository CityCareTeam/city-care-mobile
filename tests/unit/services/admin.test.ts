import { getAdminUsers, setUserEnabled, setUserRole } from '@/services/admin';

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

describe('comptes — lecture', () => {
  it('rend la liste du serveur', async () => {
    mockFetch.mockResolvedValueOnce(respond(200, { data: [{ id: 'k1', username: 'zoe' }] }));
    expect(await getAdminUsers('jeton')).toHaveLength(1);
  });

  /**
   * La recherche part au serveur : les comptes vivent dans Keycloak, pas dans la
   * base applicative, et filtrer les cent premiers côté téléphone ne trouverait
   * jamais le cent-unième.
   */
  it('transmet la recherche', async () => {
    mockFetch.mockResolvedValueOnce(respond(200, { data: [] }));
    await getAdminUsers('jeton', '  zoe ');
    expect(mockFetch.mock.calls[0][0]).toContain('search=zoe');
  });

  it('ignore une recherche vide plutôt que d’envoyer du blanc', async () => {
    mockFetch.mockResolvedValueOnce(respond(200, { data: [] }));
    await getAdminUsers('jeton', '   ');
    expect(mockFetch.mock.calls[0][0]).not.toContain('search=');
  });

  // Une réponse mal formée ne doit pas casser l'écran : il affichera « aucun
  // compte », ce qui est faux mais lisible, au lieu de planter.
  it('survit à une réponse sans liste', async () => {
    mockFetch.mockResolvedValueOnce(respond(200, { oops: true }));
    expect(await getAdminUsers('jeton')).toEqual([]);
  });

  it('lève sur un refus', async () => {
    mockFetch.mockResolvedValueOnce(respond(403));
    await expect(getAdminUsers('jeton')).rejects.toThrow();
  });
});

describe('comptes — écriture', () => {
  it('change le rôle sur l’identifiant Keycloak', async () => {
    mockFetch.mockResolvedValueOnce(respond(200));
    await setUserRole('k1', 'Agent', 'jeton');

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/admin/users/k1/role');
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body as string)).toEqual({ role: 'Agent' });
  });

  it('désactive un compte', async () => {
    mockFetch.mockResolvedValueOnce(respond(200));
    await setUserEnabled('k1', false, 'jeton');

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/admin/users/k1/enabled');
    expect(JSON.parse(options.body as string)).toEqual({ enabled: false });
  });

  /**
   * Le serveur refuse qu'un administrateur se rétrograde ou se désactive
   * lui-même — ce serait s'enfermer dehors. Le refus doit remonter, pas être
   * avalé : l'écran n'offre pas le geste, mais si jamais il l'offrait, mieux vaut
   * une erreur qu'un succès imaginaire.
   */
  it('remonte le refus du serveur', async () => {
    mockFetch.mockResolvedValueOnce(respond(400, { error: 'Vous ne pouvez pas changer votre propre rôle.' }));
    await expect(setUserRole('moi', 'Citizen', 'jeton')).rejects.toThrow(/propre rôle/);
  });
});
