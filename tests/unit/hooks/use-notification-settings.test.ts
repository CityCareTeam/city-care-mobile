import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useNotificationSettings } from '@/hooks/use-notification-settings';
import { getNotificationSettings, updateNotificationSettings } from '@/services/notifications';
import { getValidToken } from '@/storage/tokens';
import { Toast } from '@/components/ui/ToastMessage';

jest.mock('@/services/notifications');
jest.mock('@/storage/tokens');
jest.mock('@/components/ui/ToastMessage', () => ({ Toast: { show: jest.fn() } }));

const mockGetSettings    = getNotificationSettings    as jest.Mock;
const mockUpdateSettings = updateNotificationSettings as jest.Mock;
const mockGetToken       = getValidToken              as jest.Mock;
const mockToast          = Toast.show                 as jest.Mock;

const baseSettings = {
  email_enabled: false,
  push_enabled: true,
  in_app_incidents_enabled: true,
  in_app_messages_enabled: true,
  push_messages_enabled: false,
  followed_incident_types: ['Road', 'Waste'],
  updated_at: '2025-01-01T00:00:00Z',
};

describe('useNotificationSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue('token-123');
    mockGetSettings.mockResolvedValue(baseSettings);
    mockUpdateSettings.mockResolvedValue(undefined);
  });

  it('does not fetch when disabled', () => {
    renderHook(() => useNotificationSettings(false));
    expect(mockGetSettings).not.toHaveBeenCalled();
  });

  it('fetches settings when enabled', async () => {
    const { result } = renderHook(() => useNotificationSettings(true));
    await waitFor(() => expect(result.current.settings).not.toBeNull());
    expect(result.current.settings?.push_enabled).toBe(true);
    expect(result.current.settings?.followed_incident_types).toEqual(['Road', 'Waste']);
  });

  it('sets loadError on fetch failure', async () => {
    mockGetSettings.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useNotificationSettings(true));
    await waitFor(() => expect(result.current.loadError).toBe(true));
    expect(result.current.settings).toBeNull();
  });

  it('toggle updates setting optimistically', async () => {
    const { result } = renderHook(() => useNotificationSettings(true));
    await waitFor(() => expect(result.current.settings).not.toBeNull());
    act(() => result.current.toggle('push_enabled')(false));
    expect(result.current.settings?.push_enabled).toBe(false);
  });

  it('toggle calls updateNotificationSettings with correct payload', async () => {
    const { result } = renderHook(() => useNotificationSettings(true));
    await waitFor(() => expect(result.current.settings).not.toBeNull());
    act(() => result.current.toggle('in_app_incidents_enabled')(false));
    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalledWith('token-123', { in_app_incidents_enabled: false }));
  });

  it('toggle reverts to previous value on save error', async () => {
    mockUpdateSettings.mockRejectedValue(new Error('Save failed'));
    const { result } = renderHook(() => useNotificationSettings(true));
    await waitFor(() => expect(result.current.settings).not.toBeNull());
    act(() => result.current.toggle('push_enabled')(false));
    await waitFor(() => expect(result.current.settings?.push_enabled).toBe(true));
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  });

  it('toggleType adds a type not in the list', async () => {
    const { result } = renderHook(() => useNotificationSettings(true));
    await waitFor(() => expect(result.current.settings).not.toBeNull());
    act(() => result.current.toggleType('Graffiti'));
    expect(result.current.settings?.followed_incident_types).toContain('Graffiti');
    expect(result.current.settings?.followed_incident_types).toHaveLength(3);
  });

  it('toggleType removes a type already in the list', async () => {
    const { result } = renderHook(() => useNotificationSettings(true));
    await waitFor(() => expect(result.current.settings).not.toBeNull());
    act(() => result.current.toggleType('Road'));
    expect(result.current.settings?.followed_incident_types).not.toContain('Road');
    expect(result.current.settings?.followed_incident_types).toHaveLength(1);
  });

  it('shows success toast on successful save', async () => {
    const { result } = renderHook(() => useNotificationSettings(true));
    await waitFor(() => expect(result.current.settings).not.toBeNull());
    act(() => result.current.toggle('push_enabled')(false));
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' })));
  });

  it('resets and re-fetches when enabled switches from false to true', async () => {
    let enabled = false;
    const { result, rerender } = renderHook(() => useNotificationSettings(enabled));
    expect(mockGetSettings).not.toHaveBeenCalled();

    enabled = true;
    rerender({});
    await waitFor(() => expect(result.current.settings).not.toBeNull());
    expect(mockGetSettings).toHaveBeenCalledTimes(1);
  });
});
