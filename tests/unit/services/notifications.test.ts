import { STRINGS } from '@/constants/strings';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  registerPushToken,
  getNotificationSettings,
  updateNotificationSettings,
} from '@/services/notifications';

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

const notifListResponse = {
  data: [
    {
      id: 'notif-1',
      user_id: 'user-1',
      title: 'Nouveau signalement',
      body: 'route — Rue de Paris',
      type: 'new_incident',
      incident_id: 'inc-1',
      is_read: false,
      created_at: '2025-01-01T10:00:00Z',
    },
  ],
  unread_count: 1,
  total: 1,
  page: 1,
  page_size: 20,
};

const settingsResponse = {
  email_enabled: true,
  push_enabled: false,
  in_app_incidents_enabled: true,
  in_app_messages_enabled: false,
  push_messages_enabled: true,
  followed_incident_types: ['road', 'lighting'],
  updated_at: '2025-01-01T00:00:00Z',
};

// ── getNotifications ──────────────────────────────────────────────────────────

describe('getNotifications', () => {
  beforeEach(() => mockFetch.mockClear());

  it('returns notification list on success', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, notifListResponse));
    const result = await getNotifications('token');
    expect(result.data).toHaveLength(1);
    expect(result.unread_count).toBe(1);
  });

  it('sends Authorization Bearer header', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, notifListResponse));
    await getNotifications('my-token');
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer my-token');
  });

  it('appends page_size param', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, notifListResponse));
    await getNotifications('token', { page_size: 50 });
    expect(mockFetch.mock.calls[0][0]).toContain('page_size=50');
  });

  it('appends page param', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, notifListResponse));
    await getNotifications('token', { page: 2 });
    expect(mockFetch.mock.calls[0][0]).toContain('page=2');
  });

  it('appends unread_only param when true', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, notifListResponse));
    await getNotifications('token', { unread_only: true });
    expect(mockFetch.mock.calls[0][0]).toContain('unread_only=true');
  });

  it('does not append unread_only when false', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, notifListResponse));
    await getNotifications('token', { unread_only: false });
    expect(mockFetch.mock.calls[0][0]).not.toContain('unread_only');
  });

  it('throws genericError on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(500, {}));
    await expect(getNotifications('token')).rejects.toThrow(STRINGS.api.genericError);
  });

  it('throws networkError when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network request failed'));
    await expect(getNotifications('token')).rejects.toThrow(STRINGS.api.networkError);
  });
});

// ── getUnreadCount ────────────────────────────────────────────────────────────

describe('getUnreadCount', () => {
  beforeEach(() => mockFetch.mockClear());

  it('returns unread_count from response', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { unread_count: 5 }));
    const count = await getUnreadCount('token');
    expect(count).toBe(5);
  });

  it('returns 0 when response is not ok', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(401, {}));
    const count = await getUnreadCount('bad-token');
    expect(count).toBe(0);
  });

  it('returns 0 when fetch throws (silent fail)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const count = await getUnreadCount('token');
    expect(count).toBe(0);
  });
});

// ── markAsRead ────────────────────────────────────────────────────────────────

describe('markAsRead', () => {
  beforeEach(() => mockFetch.mockClear());

  it('sends PATCH to correct endpoint', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));
    await markAsRead('token', 'notif-42');
    expect(mockFetch.mock.calls[0][1].method).toBe('PATCH');
    expect(mockFetch.mock.calls[0][0]).toContain('notif-42');
  });

  it('sends Authorization Bearer header', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));
    await markAsRead('my-token', 'notif-1');
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer my-token');
  });

  it('resolves on 200', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));
    await expect(markAsRead('token', 'notif-1')).resolves.toBeUndefined();
  });

  it('throws genericError on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(404, {}));
    await expect(markAsRead('token', 'bad-id')).rejects.toThrow(STRINGS.api.genericError);
  });

  it('throws networkError when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(markAsRead('token', 'notif-1')).rejects.toThrow(STRINGS.api.networkError);
  });
});

// ── markAllAsRead ─────────────────────────────────────────────────────────────

describe('markAllAsRead', () => {
  beforeEach(() => mockFetch.mockClear());

  it('sends POST to correct endpoint', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));
    await markAllAsRead('token');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
    expect(mockFetch.mock.calls[0][0]).toContain('read-all');
  });

  it('resolves on 200', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));
    await expect(markAllAsRead('token')).resolves.toBeUndefined();
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(500, {}));
    await expect(markAllAsRead('token')).rejects.toThrow(STRINGS.api.genericError);
  });
});

// ── registerPushToken ─────────────────────────────────────────────────────────

describe('registerPushToken', () => {
  beforeEach(() => mockFetch.mockClear());

  it('sends PATCH with push_token in body', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));
    await registerPushToken('token', 'ExponentPushToken[abc123]');
    expect(mockFetch.mock.calls[0][1].method).toBe('PATCH');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.push_token).toBe('ExponentPushToken[abc123]');
  });

  it('resolves silently even when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(registerPushToken('token', 'ExponentPushToken[x]')).resolves.toBeUndefined();
  });

  it('resolves silently on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(500, {}));
    await expect(registerPushToken('token', 'ExponentPushToken[x]')).resolves.toBeUndefined();
  });
});

// ── getNotificationSettings ───────────────────────────────────────────────────

describe('getNotificationSettings', () => {
  beforeEach(() => mockFetch.mockClear());

  it('returns settings on success', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, settingsResponse));
    const result = await getNotificationSettings('token');
    expect(result.email_enabled).toBe(true);
    expect(result.push_enabled).toBe(false);
    expect(result.in_app_incidents_enabled).toBe(true);
    expect(result.in_app_messages_enabled).toBe(false);
    expect(result.push_messages_enabled).toBe(true);
    expect(result.followed_incident_types).toEqual(['road', 'lighting']);
  });

  it('sends Authorization Bearer header', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, settingsResponse));
    await getNotificationSettings('my-token');
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer my-token');
  });

  it('throws notifSettingsLoadError on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(404, {}));
    await expect(getNotificationSettings('token')).rejects.toThrow(STRINGS.api.notifSettingsLoadError);
  });

  it('throws networkError when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(getNotificationSettings('token')).rejects.toThrow(STRINGS.api.networkError);
  });
});

// ── updateNotificationSettings ────────────────────────────────────────────────

describe('updateNotificationSettings', () => {
  beforeEach(() => mockFetch.mockClear());

  it('sends PATCH with correct payload', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));
    await updateNotificationSettings('token', { push_enabled: true, email_enabled: false });
    expect(mockFetch.mock.calls[0][1].method).toBe('PATCH');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.push_enabled).toBe(true);
    expect(body.email_enabled).toBe(false);
  });

  it('sends followed_incident_types in payload', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));
    await updateNotificationSettings('token', { followed_incident_types: ['road', 'waste'] });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.followed_incident_types).toEqual(['road', 'waste']);
  });

  it('sends in_app_incidents_enabled in payload', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));
    await updateNotificationSettings('token', { in_app_incidents_enabled: false });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.in_app_incidents_enabled).toBe(false);
  });

  it('sends in_app_messages_enabled in payload', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));
    await updateNotificationSettings('token', { in_app_messages_enabled: true });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.in_app_messages_enabled).toBe(true);
  });

  it('sends push_messages_enabled in payload', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));
    await updateNotificationSettings('token', { push_messages_enabled: false });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.push_messages_enabled).toBe(false);
  });

  it('sends partial message settings patch', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));
    await updateNotificationSettings('token', {
      in_app_messages_enabled: true,
      push_messages_enabled: false,
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.in_app_messages_enabled).toBe(true);
    expect(body.push_messages_enabled).toBe(false);
    expect(body.email_enabled).toBeUndefined();
  });

  it('resolves on 200', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));
    await expect(updateNotificationSettings('token', {})).resolves.toBeUndefined();
  });

  it('throws error message from response body', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(400, { error: 'Type invalide' }));
    await expect(updateNotificationSettings('token', {})).rejects.toThrow('Type invalide');
  });

  it('throws notifSettingsUpdateError as fallback when body has no message', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(500, {}));
    await expect(updateNotificationSettings('token', {})).rejects.toThrow(STRINGS.api.notifSettingsUpdateError);
  });

  it('throws networkError when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(updateNotificationSettings('token', {})).rejects.toThrow(STRINGS.api.networkError);
  });
});
