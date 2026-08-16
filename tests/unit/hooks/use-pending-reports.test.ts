import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePendingReports } from '@/hooks/use-pending-reports';
import { enqueueReport, listPendingReports, listRejectedReports } from '@/storage/pending-reports';
import { act, renderHook, waitFor } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockCreateIncident = jest.fn();
const mockUploadPhoto = jest.fn();
const mockGetValidToken = jest.fn();

jest.mock('@/services/incidents', () => ({
  createIncident: (...args: unknown[]) => mockCreateIncident(...args),
  uploadPhoto: (...args: unknown[]) => mockUploadPhoto(...args),
}));

jest.mock('@/storage/tokens', () => ({
  getValidToken: () => mockGetValidToken(),
}));

/** Une requête qui n'a jamais atteint le serveur. */
const offline = () => Object.assign(new TypeError('Network request failed'));

const report = {
  latitude: 45.75,
  longitude: 4.85,
  type: 'Road' as const,
  description: 'Nid-de-poule',
  photos: [],
};

beforeEach(async () => {
  await AsyncStorage.clear();
  mockCreateIncident.mockReset();
  mockUploadPhoto.mockReset().mockResolvedValue(undefined);
  mockGetValidToken.mockReset().mockResolvedValue('jeton');
});

describe('usePendingReports', () => {
  it('relit la file au montage', async () => {
    await enqueueReport(report);
    const { result } = renderHook(() => usePendingReports());
    await waitFor(() => expect(result.current.pending).toHaveLength(1));
  });

  it('envoie ce qui attendait et vide la file', async () => {
    await enqueueReport(report);
    mockCreateIncident.mockResolvedValue({ id: 'inc-1' });

    const { result } = renderHook(() => usePendingReports());
    await act(async () => { await result.current.flush(); });

    expect(mockCreateIncident).toHaveBeenCalledTimes(1);
    expect(await listPendingReports()).toEqual([]);
  });

  it('envoie les photos du signalement rejoué', async () => {
    await enqueueReport({
      ...report,
      photos: [{ uri: 'file:///a.jpg', fileName: 'a.jpg', mimeType: 'image/jpeg' }],
    });
    mockCreateIncident.mockResolvedValue({ id: 'inc-1' });

    const { result } = renderHook(() => usePendingReports());
    await act(async () => { await result.current.flush(); });

    expect(mockUploadPhoto).toHaveBeenCalledWith('inc-1', 'file:///a.jpg', 'a.jpg', 'image/jpeg', 'jeton');
  });

  // Une photo perdue du cache ne doit pas faire créer le signalement deux fois.
  it('ne remet pas en file quand seule la photo échoue', async () => {
    await enqueueReport({
      ...report,
      photos: [{ uri: 'file:///disparue.jpg', fileName: 'a.jpg', mimeType: 'image/jpeg' }],
    });
    mockCreateIncident.mockResolvedValue({ id: 'inc-1' });
    mockUploadPhoto.mockRejectedValue(new Error('introuvable'));

    const { result } = renderHook(() => usePendingReports());
    await act(async () => { await result.current.flush(); });

    expect(await listPendingReports()).toEqual([]);
  });

  // Le réseau est reparti : inutile d'essayer les suivants.
  it('garde la file et s’arrête au premier échec réseau', async () => {
    await enqueueReport({ ...report, description: 'premier' });
    await enqueueReport({ ...report, description: 'second' });
    mockCreateIncident.mockRejectedValue(offline());

    const { result } = renderHook(() => usePendingReports());
    await act(async () => { await result.current.flush(); });

    expect(mockCreateIncident).toHaveBeenCalledTimes(1);
    const queue = await listPendingReports();
    expect(queue).toHaveLength(2);
    expect(queue[0].attempts).toBe(1);
  });

  // Le serveur a répondu : insister ne changera rien.
  it('verse dans les refusés ce que le serveur rejette', async () => {
    await enqueueReport(report);
    mockCreateIncident.mockRejectedValue(new Error('Description trop longue'));

    const { result } = renderHook(() => usePendingReports());
    await act(async () => { await result.current.flush(); });

    expect(await listPendingReports()).toEqual([]);
    const rejected = await listRejectedReports();
    expect(rejected[0].reason).toBe('Description trop longue');
    await waitFor(() => expect(result.current.rejected).toHaveLength(1));
  });

  // Sans session valide ce n'est plus une affaire de réseau : on n'y touche pas.
  it('laisse la file intacte sans session', async () => {
    await enqueueReport(report);
    mockGetValidToken.mockResolvedValue(null);

    const { result } = renderHook(() => usePendingReports());
    await act(async () => { await result.current.flush(); });

    expect(mockCreateIncident).not.toHaveBeenCalled();
    expect(await listPendingReports()).toHaveLength(1);
  });

  it('ne fait rien quand la file est vide', async () => {
    const { result } = renderHook(() => usePendingReports());
    await act(async () => { await result.current.flush(); });
    expect(mockCreateIncident).not.toHaveBeenCalled();
  });

  it('n’envoie pas deux fois le même signalement sur deux rejeux simultanés', async () => {
    await enqueueReport(report);
    mockCreateIncident.mockResolvedValue({ id: 'inc-1' });

    const { result } = renderHook(() => usePendingReports());
    await act(async () => {
      await Promise.all([result.current.flush(), result.current.flush()]);
    });

    expect(mockCreateIncident).toHaveBeenCalledTimes(1);
  });

  it('oublie les refusés une fois l’utilisateur prévenu', async () => {
    await enqueueReport(report);
    mockCreateIncident.mockRejectedValue(new Error('Refusé'));

    const { result } = renderHook(() => usePendingReports());
    await act(async () => { await result.current.flush(); });
    await waitFor(() => expect(result.current.rejected).toHaveLength(1));

    await act(async () => { await result.current.dismissRejected(); });
    expect(result.current.rejected).toEqual([]);
  });
});
