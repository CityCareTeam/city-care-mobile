import { renderHook } from '@testing-library/react-native';
import { RETRY_INTERVAL_MS, useAutoRefresh } from '@/hooks/use-auto-refresh';
import { act } from 'react';

// useFocusEffect se comporte comme useEffect hors navigation : l'écran testé
// est considéré au premier plan.
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(cb, [cb]);
  },
}));

const INTERVAL = 30_000;

describe('useAutoRefresh', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('charge une fois, visiblement, à l’arrivée sur l’écran', () => {
    const refresh = jest.fn();
    renderHook(() => useAutoRefresh(refresh, { interval: INTERVAL }));
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledWith(false);
  });

  it('sonde ensuite en silencieux à la cadence normale', () => {
    const refresh = jest.fn();
    renderHook(() => useAutoRefresh(refresh, { interval: INTERVAL }));
    refresh.mockClear();

    act(() => { jest.advanceTimersByTime(INTERVAL); });
    expect(refresh).toHaveBeenCalledWith(true);
  });

  it('ne fait rien tant qu’il est désactivé', () => {
    const refresh = jest.fn();
    renderHook(() => useAutoRefresh(refresh, { interval: INTERVAL, enabled: false }));
    act(() => { jest.advanceTimersByTime(INTERVAL * 3); });
    expect(refresh).not.toHaveBeenCalled();
  });

  // Le point de la reprise : ne pas attendre le cycle normal pour rattraper le
  // retour du réseau.
  it('resserre la cadence tant qu’un chargement échoue', () => {
    const refresh = jest.fn();
    const { rerender } = renderHook(
      ({ failed }) => useAutoRefresh(refresh, { interval: INTERVAL, failed }),
      { initialProps: { failed: false } },
    );

    rerender({ failed: true });
    refresh.mockClear();

    act(() => { jest.advanceTimersByTime(RETRY_INTERVAL_MS); });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('ne relance pas de chargement visible en passant en échec', () => {
    const refresh = jest.fn();
    const { rerender } = renderHook(
      ({ failed }) => useAutoRefresh(refresh, { interval: INTERVAL, failed }),
      { initialProps: { failed: false } },
    );
    refresh.mockClear();

    rerender({ failed: true });
    expect(refresh).not.toHaveBeenCalledWith(false);
  });

  it('revient à la cadence normale une fois rétabli', () => {
    const refresh = jest.fn();
    const { rerender } = renderHook(
      ({ failed }) => useAutoRefresh(refresh, { interval: INTERVAL, failed }),
      { initialProps: { failed: true } },
    );

    rerender({ failed: false });
    refresh.mockClear();

    act(() => { jest.advanceTimersByTime(RETRY_INTERVAL_MS); });
    expect(refresh).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(INTERVAL); });
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
