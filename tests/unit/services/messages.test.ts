import { API_ENDPOINTS } from '@/constants/api';
import { getMessages, sendMessage } from '@/services/messages';
import type { MessageResponse } from '@/types/messages';

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

const message: MessageResponse = {
  id: 'msg-1',
  incident_id: 'inc-1',
  author_user_id: 'user-1',
  author_name: 'Jean Dupont',
  author_role: 'Citizen',
  content: 'Bonjour, y a-t-il des avancées ?',
  created_at: '2025-01-01T10:00:00Z',
};

const agentMessage: MessageResponse = {
  id: 'msg-2',
  incident_id: 'inc-1',
  author_user_id: 'agent-1',
  author_name: 'Marie Martin',
  author_role: 'Agent',
  content: 'Intervention prévue demain.',
  created_at: '2025-01-01T11:00:00Z',
};

// ── getMessages ───────────────────────────────────────────────────────────────

describe('getMessages', () => {
  beforeEach(() => mockFetch.mockClear());

  it('returns messages when response is a direct array', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, [message, agentMessage]));
    const result = await getMessages('inc-1', 'token');
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('msg-1');
    expect(result[1].id).toBe('msg-2');
  });

  it('returns messages when response is wrapped in data field', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { data: [message] }));
    const result = await getMessages('inc-1', 'token');
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('Bonjour, y a-t-il des avancées ?');
  });

  it('returns empty array when data field is missing', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));
    const result = await getMessages('inc-1', 'token');
    expect(result).toEqual([]);
  });

  it('calls the correct endpoint with incidentId', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, []));
    await getMessages('inc-42', 'token');
    expect(mockFetch.mock.calls[0][0]).toBe(API_ENDPOINTS.incidentMessages('inc-42'));
  });

  it('sends Authorization Bearer header', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, []));
    await getMessages('inc-1', 'my-token');
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer my-token');
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(403, {}));
    await expect(getMessages('inc-1', 'token')).rejects.toThrow('Erreur 403');
  });

  it('returns messages with null author_name', async () => {
    const msg = { ...message, author_name: null };
    mockFetch.mockResolvedValueOnce(makeResponse(200, [msg]));
    const result = await getMessages('inc-1', 'token');
    expect(result[0].author_name).toBeNull();
  });

  it('returns messages with null author_role', async () => {
    const msg = { ...message, author_role: null };
    mockFetch.mockResolvedValueOnce(makeResponse(200, [msg]));
    const result = await getMessages('inc-1', 'token');
    expect(result[0].author_role).toBeNull();
  });
});

// ── sendMessage ───────────────────────────────────────────────────────────────

describe('sendMessage', () => {
  beforeEach(() => mockFetch.mockClear());

  it('returns the created message on success', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(201, message));
    const result = await sendMessage('inc-1', 'Bonjour, y a-t-il des avancées ?', 'token');
    expect(result.id).toBe('msg-1');
    expect(result.content).toBe('Bonjour, y a-t-il des avancées ?');
  });

  it('sends POST to the correct endpoint', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(201, message));
    await sendMessage('inc-42', 'test', 'token');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
    expect(mockFetch.mock.calls[0][0]).toBe(API_ENDPOINTS.incidentMessages('inc-42'));
  });

  it('sends content in JSON body', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(201, message));
    await sendMessage('inc-1', 'Mon message', 'token');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.content).toBe('Mon message');
  });

  it('sends Authorization Bearer header', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(201, message));
    await sendMessage('inc-1', 'test', 'my-token');
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer my-token');
  });

  it('sends Content-Type application/json', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(201, message));
    await sendMessage('inc-1', 'test', 'token');
    expect(mockFetch.mock.calls[0][1].headers['Content-Type']).toBe('application/json');
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(400, {}));
    await expect(sendMessage('inc-1', 'test', 'token')).rejects.toThrow('Erreur 400');
  });

  it('throws on 401 unauthorized', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(401, {}));
    await expect(sendMessage('inc-1', 'test', 'bad-token')).rejects.toThrow('Erreur 401');
  });

  it('throws on 403 forbidden (access denied on incident)', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(403, {}));
    await expect(sendMessage('inc-1', 'test', 'token')).rejects.toThrow('Erreur 403');
  });
});
