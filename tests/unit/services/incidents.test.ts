import {
  createIncident,
  getIncidents,
  updateIncidentStatus,
  deleteIncident,
  reverseGeocode,
} from '@/services/incidents';

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

const incidentResponse = {
  id: 'inc-1',
  authorUserId: 'user-1',
  type: 'Road',
  description: 'Nid de poule',
  latitude: 48.85,
  longitude: 2.35,
  addressLabel: '1 rue de Paris',
  status: 'reported' as const,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  resolvedAt: null,
};

describe('createIncident — type mapping', () => {
  beforeEach(() => mockFetch.mockClear());

  const cases: [string, number][] = [
    ['Road', 0],
    ['Lighting', 1],
    ['Waste', 2],
    ['Graffiti', 3],
    ['Safety', 4],
    ['Other', 5],
  ];

  it.each(cases)('%s maps to integer %i', async (type, expected) => {
    mockFetch.mockResolvedValueOnce(makeResponse(201, incidentResponse));
    await createIncident({ type: type as any, latitude: 0, longitude: 0, description: 'test' }, 'token');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.type).toBe(expected);
  });

  it('sends Authorization Bearer header', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(201, incidentResponse));
    await createIncident({ type: 'Road', latitude: 48.85, longitude: 2.35, description: 'test' }, 'my-token');
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer my-token');
  });

  it('throws on error response with ASP.NET validation errors', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(422, {
      errors: { Description: ['La description est requise'] },
      title: 'Validation error',
    }));
    await expect(
      createIncident({ type: 'Road', latitude: 0, longitude: 0, description: '' }, 'token'),
    ).rejects.toThrow('Description: La description est requise');
  });
});

describe('getIncidents — URL params', () => {
  beforeEach(() => mockFetch.mockClear());

  const emptyList = { data: [], pagination: { page: 1, page_size: 10, total_count: 0, total_pages: 0 } };

  it('calls without query params when none provided', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, emptyList));
    await getIncidents();
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).not.toContain('status=');
    expect(url).not.toContain('type=');
    expect(url).not.toContain('page=');
  });

  it('appends status param', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, emptyList));
    await getIncidents({ status: 'reported' });
    expect(mockFetch.mock.calls[0][0]).toContain('status=reported');
  });

  it('appends type param', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, emptyList));
    await getIncidents({ type: 'Waste' });
    expect(mockFetch.mock.calls[0][0]).toContain('type=Waste');
  });

  it('appends pagination params', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, emptyList));
    await getIncidents({ page: 2, pageSize: 20 });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('page=2');
    expect(url).toContain('pageSize=20');
  });

  it('appends all params together', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, emptyList));
    await getIncidents({ status: 'in_progress', type: 'Road', page: 1, pageSize: 10 });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('status=in_progress');
    expect(url).toContain('type=Road');
    expect(url).toContain('page=1');
    expect(url).toContain('pageSize=10');
  });

  it('throws on error response', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(500, {}));
    await expect(getIncidents()).rejects.toThrow('Impossible de charger les signalements.');
  });
});

describe('updateIncidentStatus', () => {
  beforeEach(() => mockFetch.mockClear());

  it('resolves on 204', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(204, null));
    await expect(updateIncidentStatus('inc-1', 'in_progress', 'token')).resolves.toBeUndefined();
  });

  it('sends comment in body when provided', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(204, null));
    await updateIncidentStatus('inc-1', 'resolved', 'token', 'Problème résolu');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.comment).toBe('Problème résolu');
    expect(body.status).toBe('resolved');
  });

  it('throws on error', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(404, { error: 'Not found' }));
    await expect(updateIncidentStatus('bad-id', 'resolved', 'token')).rejects.toThrow();
  });
});

describe('deleteIncident', () => {
  beforeEach(() => mockFetch.mockClear());

  it('resolves on 204', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(204, null));
    await expect(deleteIncident('inc-1', 'token')).resolves.toBeUndefined();
  });

  it('sends DELETE method with auth header', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(204, null));
    await deleteIncident('inc-1', 'my-token');
    expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer my-token');
  });

  it('throws on error', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(403, { error: 'Forbidden' }));
    await expect(deleteIncident('inc-1', 'bad-token')).rejects.toThrow();
  });
});

describe('reverseGeocode', () => {
  beforeEach(() => mockFetch.mockClear());

  it('returns geocode result on success', async () => {
    const geo = { address_label: '1 rue de Paris', city: 'Paris', postcode: '75001', country: 'France' };
    mockFetch.mockResolvedValueOnce(makeResponse(200, geo));
    await expect(reverseGeocode(48.85, 2.35)).resolves.toEqual(geo);
  });

  it('returns null on error response', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(404, {}));
    await expect(reverseGeocode(0, 0)).resolves.toBeNull();
  });
});
