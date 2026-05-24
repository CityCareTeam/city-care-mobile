import { STRINGS } from '@/constants/strings';
import { login, register, getMe, logout, refreshToken } from '@/services/auth';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeResponse(status: number, body: unknown): Response {
  const bodyStr = JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(bodyStr),
  } as unknown as Response;
}

const validLoginResponse = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  tokenType: 'Bearer',
  expiresIn: 3600,
};

describe('login', () => {
  beforeEach(() => mockFetch.mockClear());

  it('resolves with token data on 200', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, validLoginResponse));
    await expect(login({ username: 'user', password: 'pass' })).resolves.toEqual(validLoginResponse);
  });

  it('sends JSON body with credentials', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, validLoginResponse));
    await login({ username: 'alice', password: 'secret' });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body).toEqual({ username: 'alice', password: 'secret' });
  });

  it('throws "Serveur inaccessible" on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));
    await expect(login({ username: 'user', password: 'pass' }))
      .rejects.toThrow(STRINGS.api.networkError);
  });

  it('parses ASP.NET Core validation error format', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(400, {
      errors: { Username: ['Le nom d\'utilisateur est requis'] },
      title: 'One or more validation errors occurred.',
    }));
    await expect(login({ username: '', password: '' }))
      .rejects.toThrow('Le nom d\'utilisateur est requis');
  });

  it('parses Keycloak error_description format', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(401, {
      error: 'invalid_grant',
      error_description: 'Mot de passe incorrect',
    }));
    await expect(login({ username: 'user', password: 'wrong' }))
      .rejects.toThrow('Mot de passe incorrect');
  });

  it('uses message field when present in error body', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(403, {
      message: 'Compte désactivé',
    }));
    await expect(login({ username: 'user', password: 'pass' }))
      .rejects.toThrow('Compte désactivé');
  });
});

describe('register', () => {
  beforeEach(() => mockFetch.mockClear());

  it('resolves on 201', async () => {
    const payload = {
      userId: 'uid',
      email: 'user@example.com',
      username: 'user',
      firstName: 'User',
      lastName: 'Test',
      message: 'Compte créé',
    };
    mockFetch.mockResolvedValueOnce(makeResponse(201, payload));

    await expect(
      register({ email: 'user@example.com', username: 'user', firstName: 'User', lastName: 'Test', password: 'pass' }),
    ).resolves.toEqual(payload);
  });

  it('throws "Serveur inaccessible" on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(
      register({ email: 'a@b.com', username: 'a', firstName: 'A', lastName: 'B', password: 'p' }),
    ).rejects.toThrow('Serveur inaccessible. Vérifiez votre connexion.');
  });
});

describe('refreshToken', () => {
  beforeEach(() => mockFetch.mockClear());

  it('resolves with new tokens on 200', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, validLoginResponse));
    await expect(refreshToken('old-refresh')).resolves.toEqual(validLoginResponse);
  });

  it('throws "Session expirée" on 401', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(401, { title: 'Session expirée.' }));
    await expect(refreshToken('bad-token')).rejects.toThrow(STRINGS.api.sessionExpired);
  });
});

describe('getMe', () => {
  beforeEach(() => mockFetch.mockClear());

  it('resolves with user data on 200', async () => {
    const me = {
      sub: '123',
      email: 'user@example.com',
      username: 'user',
      firstName: 'Jean',
      lastName: 'Dupont',
      roles: ['Citizen'],
      mainRole: 'Citizen' as const,
    };
    mockFetch.mockResolvedValueOnce(makeResponse(200, me));
    await expect(getMe('valid-token')).resolves.toEqual(me);
  });

  it('sends Authorization Bearer header', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));
    await getMe('my-access-token');
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer my-access-token');
  });

  it('throws "Non autorisé" on 401', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(401, {}));
    await expect(getMe('expired-token')).rejects.toThrow(STRINGS.api.unauthorized);
  });
});

describe('logout', () => {
  beforeEach(() => mockFetch.mockClear());

  it('resolves without error on success', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));
    await expect(logout('refresh-token')).resolves.toBeUndefined();
  });

  it('silently ignores network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(logout('refresh-token')).resolves.toBeUndefined();
  });

  it('silently ignores server errors', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(500, { error: 'Internal error' }));
    await expect(logout('refresh-token')).resolves.toBeUndefined();
  });
});
