import { STRINGS } from '@/constants/strings';
import { getUserMe, getMyIncidents } from '@/services/users';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

const userMe = {
  id: 'db-uid-1',
  keycloakId: 'kc-uid-1',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const myIncidentsResponse = {
  data: [
    {
      id: 'inc-1',
      type: 'Road',
      status: 'reported',
      description: 'Nid de poule',
      latitude: 45.748,
      longitude: 4.847,
      address_label: '1 rue de Lyon',
      createdAt: '2025-01-01T00:00:00Z',
    },
  ],
  pagination: { page: 1, page_size: 10, total_count: 1, total_pages: 1 },
};

describe('getUserMe', () => {
  beforeEach(() => mockFetch.mockClear());

  it('resolves with user data on 200', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, userMe));
    await expect(getUserMe('token')).resolves.toEqual(userMe);
  });

  it('sends Authorization Bearer header', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, userMe));
    await getUserMe('my-token');
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer my-token');
  });

  it('throws profileLoadError on 401', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(401, {}));
    await expect(getUserMe('expired-token')).rejects.toThrow(STRINGS.api.profileLoadError);
  });

  it('throws profileLoadError on 403', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(403, {}));
    await expect(getUserMe('bad-token')).rejects.toThrow(STRINGS.api.profileLoadError);
  });
});

describe('getMyIncidents', () => {
  beforeEach(() => mockFetch.mockClear());

  it('resolves with incidents list on 200', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, myIncidentsResponse));
    await expect(getMyIncidents('token')).resolves.toEqual(myIncidentsResponse);
  });

  it('sends Authorization Bearer header', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, myIncidentsResponse));
    await getMyIncidents('my-token');
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer my-token');
  });

  it('resolves with empty list when no incidents', async () => {
    const empty = { data: [], pagination: { page: 1, page_size: 10, total_count: 0, total_pages: 0 } };
    mockFetch.mockResolvedValueOnce(makeResponse(200, empty));
    const result = await getMyIncidents('token');
    expect(result.data).toHaveLength(0);
  });

  it('throws incidentsLoadError on error response', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(500, {}));
    await expect(getMyIncidents('token')).rejects.toThrow(STRINGS.api.incidentsLoadError);
  });
});
