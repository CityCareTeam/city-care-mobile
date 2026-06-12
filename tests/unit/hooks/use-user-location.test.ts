import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useUserLocation } from '@/hooks/use-user-location';
import { DEFAULT_LOCATION, MAP_DELTAS } from '@/constants/config';
import * as Location from 'expo-location';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

const mockRequestPermission = Location.requestForegroundPermissionsAsync as jest.Mock;
const mockGetPosition = Location.getCurrentPositionAsync as jest.Mock;

describe('useUserLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts with DEFAULT_LOCATION and loading true', async () => {
    mockRequestPermission.mockResolvedValue({ status: 'denied' });
    const { result } = renderHook(() => useUserLocation());
    expect(result.current.coords).toEqual(DEFAULT_LOCATION);
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('loading becomes false after permission denied', async () => {
    mockRequestPermission.mockResolvedValue({ status: 'denied' });
    const { result } = renderHook(() => useUserLocation());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.coords).toEqual(DEFAULT_LOCATION);
  });

  it('updates coords when permission is granted and GPS succeeds', async () => {
    const gpsCoords = { latitude: 48.8566, longitude: 2.3522 };
    mockRequestPermission.mockResolvedValue({ status: 'granted' });
    mockGetPosition.mockResolvedValue({ coords: gpsCoords });
    const { result } = renderHook(() => useUserLocation());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.coords).toEqual(gpsCoords);
  });

  it('falls back to DEFAULT_LOCATION when GPS throws', async () => {
    mockRequestPermission.mockResolvedValue({ status: 'granted' });
    mockGetPosition.mockRejectedValue(new Error('GPS unavailable'));
    const { result } = renderHook(() => useUserLocation());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.coords).toEqual(DEFAULT_LOCATION);
  });

  it('region uses MAP_DELTAS.user by default', async () => {
    mockRequestPermission.mockResolvedValue({ status: 'denied' });
    const { result } = renderHook(() => useUserLocation());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.region.latitudeDelta).toBe(MAP_DELTAS.user);
    expect(result.current.region.longitudeDelta).toBe(MAP_DELTAS.user);
  });

  it('region uses the provided delta parameter', async () => {
    mockRequestPermission.mockResolvedValue({ status: 'denied' });
    const { result } = renderHook(() => useUserLocation(0.01));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.region.latitudeDelta).toBe(0.01);
    expect(result.current.region.longitudeDelta).toBe(0.01);
  });

  it('region latitude/longitude match current coords', async () => {
    const gpsCoords = { latitude: 51.5074, longitude: -0.1278 };
    mockRequestPermission.mockResolvedValue({ status: 'granted' });
    mockGetPosition.mockResolvedValue({ coords: gpsCoords });
    const { result } = renderHook(() => useUserLocation());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.region.latitude).toBe(gpsCoords.latitude);
    expect(result.current.region.longitude).toBe(gpsCoords.longitude);
  });

  it('setCoords updates coords and region immediately', async () => {
    mockRequestPermission.mockResolvedValue({ status: 'denied' });
    const { result } = renderHook(() => useUserLocation());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const newCoords = { latitude: 43.2965, longitude: 5.3698 };
    act(() => result.current.setCoords(newCoords));
    expect(result.current.coords).toEqual(newCoords);
    expect(result.current.region).toMatchObject(newCoords);
  });
});
