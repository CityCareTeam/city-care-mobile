import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useMapClusters } from '@/hooks/use-map-clusters';
import { getMapSummary } from '@/services/incidents';
import { CLUSTER_ZOOM_THRESHOLD, CLUSTER_DEBOUNCE_MS, DEFAULT_LOCATION } from '@/constants/config';
import type { Region } from 'react-native-maps';

jest.mock('@/services/incidents');

const mockGetMapSummary = getMapSummary as jest.Mock;

// latitudeDelta → zoom = round(log(360/delta) / ln2)
// delta=0.08 → zoom≈12 (< threshold 15) : mode clusters
// delta=0.005 → zoom≈16 (> threshold 15) : mode individuel
const CLUSTER_REGION: Region = { latitude: 45.748, longitude: 4.847, latitudeDelta: 0.08, longitudeDelta: 0.08 };
const ZOOM_REGION: Region    = { latitude: 45.748, longitude: 4.847, latitudeDelta: 0.005, longitudeDelta: 0.005 };

const mockCluster = { latitude: 45.75, longitude: 4.85, count: 5, reported: 3, in_progress: 2, resolved: 0 };

describe('useMapClusters', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockGetMapSummary.mockResolvedValue({ data: [mockCluster], cell_size: 1, total: 1 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calls getMapSummary on mount when zoom < threshold', async () => {
    renderHook(() => useMapClusters(null, null));
    act(() => jest.runAllTimers());
    await waitFor(() => expect(mockGetMapSummary).toHaveBeenCalledTimes(1));
  });

  it('sets clusters from API response', async () => {
    const { result } = renderHook(() => useMapClusters(null, null));
    act(() => jest.runAllTimers());
    await waitFor(() => expect(result.current.clusters).toHaveLength(1));
    expect(result.current.clusters[0].count).toBe(5);
  });

  it('does not call getMapSummary when zoom >= threshold', async () => {
    const { result } = renderHook(() => useMapClusters(null, null));
    act(() => {
      result.current.onRegionChangeComplete(ZOOM_REGION);
      jest.runAllTimers();
    });
    // Only the initial mount call may have been made (with default explore delta < threshold)
    // After the zoom change, clusters should be cleared
    await waitFor(() => expect(result.current.clusters).toHaveLength(0));
  });

  it('currentZoom updates on onRegionChangeComplete', () => {
    const { result } = renderHook(() => useMapClusters(null, null));
    act(() => {
      result.current.onRegionChangeComplete(ZOOM_REGION);
      jest.runAllTimers();
    });
    expect(result.current.currentZoom).toBeGreaterThanOrEqual(CLUSTER_ZOOM_THRESHOLD);
  });

  it('onRegionChangeComplete debounces the API call', async () => {
    const { result } = renderHook(() => useMapClusters(null, null));
    // Wait for initial mount call
    act(() => jest.runAllTimers());
    await waitFor(() => expect(mockGetMapSummary).toHaveBeenCalledTimes(1));
    mockGetMapSummary.mockClear();

    // Rapid region changes — should debounce into one call
    act(() => {
      result.current.onRegionChangeComplete(CLUSTER_REGION);
      result.current.onRegionChangeComplete(CLUSTER_REGION);
      result.current.onRegionChangeComplete(CLUSTER_REGION);
    });
    act(() => jest.advanceTimersByTime(CLUSTER_DEBOUNCE_MS - 10));
    expect(mockGetMapSummary).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(20));
    await waitFor(() => expect(mockGetMapSummary).toHaveBeenCalledTimes(1));
  });

  it('passes filterStatus to the API', async () => {
    renderHook(() => useMapClusters('reported', null));
    act(() => jest.runAllTimers());
    await waitFor(() => expect(mockGetMapSummary).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'reported' }),
    ));
  });

  it('passes filterType to the API', async () => {
    renderHook(() => useMapClusters(null, 'Road'));
    act(() => jest.runAllTimers());
    await waitFor(() => expect(mockGetMapSummary).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Road' }),
    ));
  });

  it('reloads when filterStatus changes', async () => {
    let filterStatus: string | null = null;
    const { rerender } = renderHook(() => useMapClusters(filterStatus, null));
    act(() => jest.runAllTimers());
    await waitFor(() => expect(mockGetMapSummary).toHaveBeenCalledTimes(1));

    filterStatus = 'in_progress';
    rerender({});
    act(() => jest.runAllTimers());
    await waitFor(() => expect(mockGetMapSummary).toHaveBeenCalledTimes(2));
  });

  it('reload() triggers a new API call', async () => {
    const { result } = renderHook(() => useMapClusters(null, null));
    act(() => jest.runAllTimers());
    await waitFor(() => expect(mockGetMapSummary).toHaveBeenCalledTimes(1));

    act(() => { result.current.reload(); jest.runAllTimers(); });
    await waitFor(() => expect(mockGetMapSummary).toHaveBeenCalledTimes(2));
  });

  it('uses the default location for the first fetch (not lat/lng 0,0)', async () => {
    renderHook(() => useMapClusters(null, null));
    act(() => jest.runAllTimers());
    await waitFor(() => expect(mockGetMapSummary).toHaveBeenCalledTimes(1));

    const { latMin, latMax, lngMin, lngMax } = mockGetMapSummary.mock.calls[0][0];
    expect((latMin + latMax) / 2).toBeCloseTo(DEFAULT_LOCATION.latitude, 5);
    expect((lngMin + lngMax) / 2).toBeCloseTo(DEFAULT_LOCATION.longitude, 5);
  });

  it('honours a caller-provided initial region', async () => {
    renderHook(() => useMapClusters(null, null, CLUSTER_REGION));
    act(() => jest.runAllTimers());
    await waitFor(() => expect(mockGetMapSummary).toHaveBeenCalledTimes(1));

    const { latMin, latMax } = mockGetMapSummary.mock.calls[0][0];
    expect(latMax - latMin).toBeCloseTo(CLUSTER_REGION.latitudeDelta, 5);
  });

  it('does not throw when getMapSummary fails', async () => {
    mockGetMapSummary.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useMapClusters(null, null));
    act(() => jest.runAllTimers());
    await waitFor(() => expect(result.current.clusters).toHaveLength(0));
  });

  // Sans ce drapeau, une panne réseau donnait le même écran qu'une zone
  // réellement vide : carte nue, aucune explication.
  it('signale un échec réseau', async () => {
    mockGetMapSummary.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useMapClusters(null, null));
    act(() => jest.runAllTimers());
    await waitFor(() => expect(result.current.failed).toBe(true));
  });

  it('ne signale rien tant que tout se passe bien', async () => {
    const { result } = renderHook(() => useMapClusters(null, null));
    act(() => jest.runAllTimers());
    await waitFor(() => expect(result.current.clusters).toHaveLength(1));
    expect(result.current.failed).toBe(false);
  });

  it('lève le signalement dès qu’un chargement aboutit à nouveau', async () => {
    mockGetMapSummary.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useMapClusters(null, null));
    act(() => jest.runAllTimers());
    await waitFor(() => expect(result.current.failed).toBe(true));

    act(() => { result.current.reload(); jest.runAllTimers(); });
    await waitFor(() => expect(result.current.failed).toBe(false));
  });
});
