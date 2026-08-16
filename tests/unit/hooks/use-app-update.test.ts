import { useAppUpdate, useRunningUpdate } from '@/hooks/use-app-update';
import { act, renderHook, waitFor } from '@testing-library/react-native';

const state: {
  isUpdatePending: boolean;
  currentlyRunning: { updateId: string | null; isEmbeddedLaunch: boolean };
} = {
  isUpdatePending: false,
  currentlyRunning: { updateId: null, isEmbeddedLaunch: true },
};

const mockReloadAsync = jest.fn(() => Promise.resolve());

jest.mock('expo-updates', () => ({
  useUpdates: () => state,
  reloadAsync: () => mockReloadAsync(),
}));

beforeEach(() => {
  state.isUpdatePending = false;
  state.currentlyRunning = { updateId: null, isEmbeddedLaunch: true };
  mockReloadAsync.mockClear();
  mockReloadAsync.mockImplementation(() => Promise.resolve());
});

describe('useAppUpdate', () => {
  it('ne signale rien tant qu’aucune mise à jour n’est téléchargée', () => {
    const { result } = renderHook(() => useAppUpdate());
    expect(result.current.ready).toBe(false);
  });

  it('signale la mise à jour une fois téléchargée', () => {
    state.isUpdatePending = true;
    const { result } = renderHook(() => useAppUpdate());
    expect(result.current.ready).toBe(true);
  });

  it('recharge l’application à la demande', async () => {
    state.isUpdatePending = true;
    const { result } = renderHook(() => useAppUpdate());
    await act(() => result.current.apply());
    expect(mockReloadAsync).toHaveBeenCalledTimes(1);
  });

  // Un rechargement raté ne doit pas laisser un bouton mort : la mise à jour
  // s'appliquera au prochain démarrage, réessayer ne coûte rien.
  it('rend la main quand le rechargement échoue', async () => {
    state.isUpdatePending = true;
    mockReloadAsync.mockImplementation(() => Promise.reject(new Error('boom')));
    const { result } = renderHook(() => useAppUpdate());
    await act(() => result.current.apply());
    await waitFor(() => expect(result.current.applying).toBe(false));
    expect(result.current.ready).toBe(true);
  });

  // La bannière est une proposition : la refuser la fait taire, sans perdre la
  // mise à jour déjà présente sur l'appareil.
  it('se tait une fois refusée', () => {
    state.isUpdatePending = true;
    const { result } = renderHook(() => useAppUpdate());
    act(() => result.current.dismiss());
    expect(result.current.ready).toBe(false);
  });
});

describe('useRunningUpdate', () => {
  // Sur un APK fraîchement installé il n'y a rien à distinguer.
  it('reste vide sur le bundle embarqué', () => {
    state.currentlyRunning = { updateId: 'a1b2c3d4-0000-0000-0000-000000000000', isEmbeddedLaunch: true };
    const { result } = renderHook(() => useRunningUpdate());
    expect(result.current).toBe('');
  });

  it('tronque l’identifiant du bundle appliqué', () => {
    state.currentlyRunning = { updateId: 'a1b2c3d4-0000-0000-0000-000000000000', isEmbeddedLaunch: false };
    const { result } = renderHook(() => useRunningUpdate());
    expect(result.current).toBe('a1b2c3d4');
  });

  // En développement `expo-updates` est inactif : pas d'identifiant du tout.
  it('reste vide sans identifiant', () => {
    state.currentlyRunning = { updateId: null, isEmbeddedLaunch: false };
    const { result } = renderHook(() => useRunningUpdate());
    expect(result.current).toBe('');
  });
});
