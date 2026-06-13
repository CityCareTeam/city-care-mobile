import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useIncidentPhotos } from '@/hooks/use-incident-photos';
import { getPhotos, getStatusHistory, deletePhoto } from '@/services/incidents';
import { getValidToken } from '@/storage/tokens';
import type { PhotoResponse, StatusHistoryEntry } from '@/types/incidents';

jest.mock('@/services/incidents');
jest.mock('@/storage/tokens');

const mockGetPhotos      = getPhotos      as jest.Mock;
const mockGetHistory     = getStatusHistory as jest.Mock;
const mockDeletePhoto    = deletePhoto    as jest.Mock;
const mockGetToken       = getValidToken  as jest.Mock;

const photo1: PhotoResponse = {
  id: 'photo-1', incidentId: 'inc-1', url: 'https://example.com/1.jpg',
  fileName: '1.jpg', contentType: 'image/jpeg', sizeBytes: 1024,
  uploadedByUserId: 'user-1', createdAt: '2025-01-01T00:00:00Z',
};
const photo2: PhotoResponse = { ...photo1, id: 'photo-2', url: 'https://example.com/2.jpg' };

const historyEntry: StatusHistoryEntry = {
  id: 'hist-1', oldStatus: 'reported', newStatus: 'in_progress',
  changedByUserId: 'user-1', changedByKeycloakId: 'kc-1',
  comment: null, changedAt: '2025-01-02T00:00:00Z',
};

describe('useIncidentPhotos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue('token-123');
    mockGetPhotos.mockResolvedValue([photo1, photo2]);
    mockGetHistory.mockResolvedValue([historyEntry]);
  });

  it('starts with empty state', () => {
    const { result } = renderHook(() => useIncidentPhotos(null));
    expect(result.current.photos).toHaveLength(0);
    expect(result.current.statusHistory).toHaveLength(0);
    expect(result.current.photosLoading).toBe(false);
    expect(result.current.photosError).toBe(false);
  });

  it('fetches photos and history when incidentId is set', async () => {
    const { result } = renderHook(() => useIncidentPhotos('inc-1'));
    await waitFor(() => expect(result.current.photosLoading).toBe(false));
    expect(result.current.photos).toHaveLength(2);
    expect(result.current.statusHistory).toHaveLength(1);
    expect(result.current.photos[0].id).toBe('photo-1');
  });

  it('sets photosError when getPhotos fails', async () => {
    mockGetPhotos.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useIncidentPhotos('inc-1'));
    await waitFor(() => expect(result.current.photosLoading).toBe(false));
    expect(result.current.photosError).toBe(true);
    expect(result.current.photos).toHaveLength(0);
  });

  it('still loads history when only photos fail', async () => {
    mockGetPhotos.mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useIncidentPhotos('inc-1'));
    await waitFor(() => expect(result.current.photosLoading).toBe(false));
    expect(result.current.statusHistory).toHaveLength(1);
  });

  it('resets state when incidentId becomes null', async () => {
    const { result, rerender } = renderHook(({ id }) => useIncidentPhotos(id), {
      initialProps: { id: 'inc-1' as string | null },
    });
    await waitFor(() => expect(result.current.photos).toHaveLength(2));
    rerender({ id: null });
    expect(result.current.photos).toHaveLength(0);
    expect(result.current.statusHistory).toHaveLength(0);
    expect(result.current.photosError).toBe(false);
  });

  it('handleDeletePhoto shows a confirmation Alert', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { result } = renderHook(() => useIncidentPhotos('inc-1'));
    await waitFor(() => expect(result.current.photos).toHaveLength(2));
    act(() => result.current.handleDeletePhoto('photo-1'));
    expect(alertSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(Array),
    );
  });

  it('removes photo from state after confirmed delete', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      const confirm = buttons?.find(b => b.style === 'destructive');
      confirm?.onPress?.();
    });
    mockDeletePhoto.mockResolvedValue(undefined);

    const { result } = renderHook(() => useIncidentPhotos('inc-1'));
    await waitFor(() => expect(result.current.photos).toHaveLength(2));
    act(() => result.current.handleDeletePhoto('photo-1'));
    await waitFor(() => expect(result.current.photos).toHaveLength(1));
    expect(result.current.photos[0].id).toBe('photo-2');
    expect(mockDeletePhoto).toHaveBeenCalledWith('inc-1', 'photo-1', 'token-123');
  });

  it('does not remove photo when Alert is cancelled', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      const cancel = buttons?.find(b => b.style === 'cancel');
      cancel?.onPress?.();
    });

    const { result } = renderHook(() => useIncidentPhotos('inc-1'));
    await waitFor(() => expect(result.current.photos).toHaveLength(2));
    act(() => result.current.handleDeletePhoto('photo-1'));
    expect(mockDeletePhoto).not.toHaveBeenCalled();
    expect(result.current.photos).toHaveLength(2);
  });
});
