import { useIncidentsPaging } from '@/hooks/use-incidents-paging';
import type { IncidentListResponse } from '@/types/incidents';
import { act, renderHook } from '@testing-library/react-native';

const mockGetIncidents = jest.fn();

jest.mock('@/services/incidents', () => ({
  getIncidents: (params: unknown) => mockGetIncidents(params),
}));

function page(
  ids: string[],
  { page = 1, totalPages = 1, totalCount = ids.length } = {},
): IncidentListResponse {
  return {
    data: ids.map((id) => ({ id })) as IncidentListResponse['data'],
    pagination: { page, page_size: 50, total_count: totalCount, total_pages: totalPages },
  };
}

beforeEach(() => mockGetIncidents.mockReset());

describe('useIncidentsPaging', () => {
  it('part d’une liste vide', () => {
    const { result } = renderHook(() => useIncidentsPaging());
    expect(result.current.incidents).toEqual([]);
    expect(result.current.hasMore).toBe(false);
  });

  it('retient le total du serveur, pas la taille de la page', () => {
    const { result } = renderHook(() => useIncidentsPaging());
    act(() => result.current.receiveFirstPage(page(['a', 'b'], { totalCount: 137, totalPages: 3 }), { reset: false }));
    expect(result.current.totalCount).toBe(137);
    expect(result.current.hasMore).toBe(true);
  });

  it('va chercher la page suivante et l’ajoute à la suite', async () => {
    const { result } = renderHook(() => useIncidentsPaging());
    act(() => result.current.receiveFirstPage(page(['a', 'b'], { totalPages: 2, totalCount: 3 }), { reset: false }));

    mockGetIncidents.mockResolvedValueOnce(page(['c'], { page: 2, totalPages: 2, totalCount: 3 }));
    await act(async () => { await result.current.loadMore(); });

    expect(mockGetIncidents).toHaveBeenCalledWith({ page: 2, pageSize: 50 });
    expect(result.current.incidents.map((i) => i.id)).toEqual(['a', 'b', 'c']);
    expect(result.current.hasMore).toBe(false);
  });

  // C'était tout le problème : au-delà de la première page, les signalements
  // les plus anciens étaient inatteignables.
  it('déroule plusieurs pages d’affilée', async () => {
    const { result } = renderHook(() => useIncidentsPaging());
    act(() => result.current.receiveFirstPage(page(['a'], { totalPages: 3, totalCount: 3 }), { reset: false }));

    mockGetIncidents.mockResolvedValueOnce(page(['b'], { page: 2, totalPages: 3, totalCount: 3 }));
    await act(async () => { await result.current.loadMore(); });
    mockGetIncidents.mockResolvedValueOnce(page(['c'], { page: 3, totalPages: 3, totalCount: 3 }));
    await act(async () => { await result.current.loadMore(); });

    expect(mockGetIncidents).toHaveBeenLastCalledWith({ page: 3, pageSize: 50 });
    expect(result.current.incidents.map((i) => i.id)).toEqual(['a', 'b', 'c']);
    expect(result.current.hasMore).toBe(false);
  });

  it('ne redemande rien une fois la dernière page atteinte', async () => {
    const { result } = renderHook(() => useIncidentsPaging());
    act(() => result.current.receiveFirstPage(page(['a'], { totalPages: 1 }), { reset: false }));
    await act(async () => { await result.current.loadMore(); });
    expect(mockGetIncidents).not.toHaveBeenCalled();
  });

  // Le bouton est désactivé pendant le chargement, mais deux appels dans le
  // même tour de boucle ne doivent pas partir chercher la même page.
  it('ne charge pas deux fois la même page', async () => {
    const { result } = renderHook(() => useIncidentsPaging());
    act(() => result.current.receiveFirstPage(page(['a'], { totalPages: 2, totalCount: 2 }), { reset: false }));

    mockGetIncidents.mockResolvedValue(page(['b'], { page: 2, totalPages: 2, totalCount: 2 }));
    await act(async () => {
      await Promise.all([result.current.loadMore(), result.current.loadMore()]);
    });

    expect(mockGetIncidents).toHaveBeenCalledTimes(1);
  });

  it('signale l’échec sans perdre ce qui est déjà chargé', async () => {
    const { result } = renderHook(() => useIncidentsPaging());
    act(() => result.current.receiveFirstPage(page(['a'], { totalPages: 2, totalCount: 2 }), { reset: false }));

    mockGetIncidents.mockRejectedValueOnce(new Error('réseau'));
    let ok = true;
    await act(async () => { ok = await result.current.loadMore(); });

    expect(ok).toBe(false);
    expect(result.current.incidents.map((i) => i.id)).toEqual(['a']);
    expect(result.current.hasMore).toBe(true);
  });

  // Un relevé toutes les quinze secondes ne doit pas replier la liste sous les
  // doigts de qui la déroule.
  it('le rafraîchissement silencieux garde les pages ouvertes', async () => {
    const { result } = renderHook(() => useIncidentsPaging());
    act(() => result.current.receiveFirstPage(page(['b'], { totalPages: 2, totalCount: 2 }), { reset: false }));
    mockGetIncidents.mockResolvedValueOnce(page(['c'], { page: 2, totalPages: 2, totalCount: 2 }));
    await act(async () => { await result.current.loadMore(); });

    // Un nouveau signalement est arrivé en tête entre-temps.
    act(() => result.current.receiveFirstPage(page(['a', 'b'], { totalPages: 2, totalCount: 3 }), { reset: false }));

    expect(result.current.incidents.map((i) => i.id)).toEqual(['a', 'b', 'c']);
    expect(result.current.hasMore).toBe(false);
  });

  // Le tiré-pour-rafraîchir, lui, demande explicitement du propre.
  it('le tiré-pour-rafraîchir referme les pages ouvertes', async () => {
    const { result } = renderHook(() => useIncidentsPaging());
    act(() => result.current.receiveFirstPage(page(['a'], { totalPages: 2, totalCount: 2 }), { reset: false }));
    mockGetIncidents.mockResolvedValueOnce(page(['b'], { page: 2, totalPages: 2, totalCount: 2 }));
    await act(async () => { await result.current.loadMore(); });
    expect(result.current.hasMore).toBe(false);

    act(() => result.current.receiveFirstPage(page(['a'], { totalPages: 2, totalCount: 2 }), { reset: true }));

    expect(result.current.incidents.map((i) => i.id)).toEqual(['a']);
    expect(result.current.hasMore).toBe(true);
  });
});
