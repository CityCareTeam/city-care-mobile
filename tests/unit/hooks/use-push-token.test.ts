import { renderHook, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { usePushToken } from '@/hooks/use-push-token';
import { registerPushToken } from '@/services/notifications';
import { getValidToken } from '@/storage/tokens';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

jest.mock('@/services/notifications');
jest.mock('@/storage/tokens');
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    appOwnership: null,
    expoConfig: { extra: { eas: { projectId: 'test-project-id' } } },
  },
}));
jest.mock('expo-notifications', () => ({
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync:         jest.fn(),
  requestPermissionsAsync:     jest.fn(),
  getExpoPushTokenAsync:       jest.fn(),
  AndroidImportance: { MAX: 5 },
}));

const mockGetPermissions     = Notifications.getPermissionsAsync     as jest.Mock;
const mockRequestPermissions = Notifications.requestPermissionsAsync as jest.Mock;
const mockGetPushToken       = Notifications.getExpoPushTokenAsync   as jest.Mock;
const mockSetChannel         = Notifications.setNotificationChannelAsync as jest.Mock;
const mockRegisterToken      = registerPushToken as jest.Mock;
const mockGetToken           = getValidToken     as jest.Mock;

describe('usePushToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue('auth-token');
    mockGetPermissions.mockResolvedValue({ status: 'granted' });
    mockGetPushToken.mockResolvedValue({ data: 'ExponentPushToken[xxx]' });
    mockRegisterToken.mockResolvedValue(undefined);
    // Default: iOS
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  });

  it('does nothing when not authenticated', async () => {
    renderHook(() => usePushToken(false));
    // allow microtasks to flush
    await Promise.resolve();
    expect(mockGetPermissions).not.toHaveBeenCalled();
    expect(mockRegisterToken).not.toHaveBeenCalled();
  });

  it('registers push token when authenticated and permissions granted', async () => {
    renderHook(() => usePushToken(true));
    await waitFor(() => expect(mockRegisterToken).toHaveBeenCalled());
    expect(mockRegisterToken).toHaveBeenCalledWith('auth-token', 'ExponentPushToken[xxx]');
  });

  it('requests permissions when not yet granted', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'undetermined' });
    mockRequestPermissions.mockResolvedValue({ status: 'granted' });
    renderHook(() => usePushToken(true));
    await waitFor(() => expect(mockRegisterToken).toHaveBeenCalled());
    expect(mockRequestPermissions).toHaveBeenCalled();
  });

  it('does not register token when permissions are denied', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'denied' });
    mockRequestPermissions.mockResolvedValue({ status: 'denied' });
    renderHook(() => usePushToken(true));
    await Promise.resolve();
    await Promise.resolve();
    expect(mockRegisterToken).not.toHaveBeenCalled();
  });

  it('does not register token when no auth token is available', async () => {
    mockGetToken.mockResolvedValue(null);
    renderHook(() => usePushToken(true));
    await Promise.resolve();
    await Promise.resolve();
    expect(mockRegisterToken).not.toHaveBeenCalled();
  });

  it('does not register token when projectId is missing', async () => {
    const original = (Constants as any).expoConfig;
    (Constants as any).expoConfig = null;
    renderHook(() => usePushToken(true));
    await Promise.resolve();
    await Promise.resolve();
    expect(mockRegisterToken).not.toHaveBeenCalled();
    (Constants as any).expoConfig = original;
  });

  it('sets Android notification channel when platform is Android', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    renderHook(() => usePushToken(true));
    await waitFor(() => expect(mockSetChannel).toHaveBeenCalled());
    expect(mockSetChannel).toHaveBeenCalledWith('default', expect.objectContaining({ name: 'CityCare+' }));
  });

  it('does not set notification channel on iOS', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    renderHook(() => usePushToken(true));
    await waitFor(() => expect(mockRegisterToken).toHaveBeenCalled());
    expect(mockSetChannel).not.toHaveBeenCalled();
  });

  it('re-runs when isAuthenticated switches from false to true', async () => {
    let authenticated = false;
    const { rerender } = renderHook(() => usePushToken(authenticated));
    expect(mockGetPermissions).not.toHaveBeenCalled();

    authenticated = true;
    rerender({});
    await waitFor(() => expect(mockRegisterToken).toHaveBeenCalled());
    expect(mockRegisterToken).toHaveBeenCalledTimes(1);
  });
});
