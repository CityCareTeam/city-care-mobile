import { renderHook, act } from '@testing-library/react-native';
import { useEasterEgg } from '@/hooks/use-easter-egg';

describe('useEasterEgg', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('active is false initially', () => {
    const { result } = renderHook(() => useEasterEgg());
    expect(result.current.active).toBe(false);
  });

  it('active becomes true after 10 taps', () => {
    const { result } = renderHook(() => useEasterEgg());
    act(() => {
      for (let i = 0; i < 10; i++) result.current.onTap();
    });
    expect(result.current.active).toBe(true);
  });

  it('active stays false after 9 taps', () => {
    const { result } = renderHook(() => useEasterEgg());
    act(() => {
      for (let i = 0; i < 9; i++) result.current.onTap();
    });
    expect(result.current.active).toBe(false);
  });

  it('dismiss sets active back to false', () => {
    const { result } = renderHook(() => useEasterEgg());
    act(() => {
      for (let i = 0; i < 10; i++) result.current.onTap();
    });
    expect(result.current.active).toBe(true);
    act(() => result.current.dismiss());
    expect(result.current.active).toBe(false);
  });

  it('count resets after timeout — 9 more taps do not trigger active', () => {
    const { result } = renderHook(() => useEasterEgg());
    act(() => {
      for (let i = 0; i < 9; i++) result.current.onTap();
    });
    act(() => jest.advanceTimersByTime(1500));
    act(() => {
      for (let i = 0; i < 9; i++) result.current.onTap();
    });
    expect(result.current.active).toBe(false);
  });

  it('activates normally after a reset when 10 fresh taps follow', () => {
    const { result } = renderHook(() => useEasterEgg());
    act(() => {
      for (let i = 0; i < 9; i++) result.current.onTap();
    });
    act(() => jest.advanceTimersByTime(1500));
    act(() => {
      for (let i = 0; i < 10; i++) result.current.onTap();
    });
    expect(result.current.active).toBe(true);
  });

  it('consecutive sequences both trigger active (dismiss resets state)', () => {
    const { result } = renderHook(() => useEasterEgg());
    act(() => {
      for (let i = 0; i < 10; i++) result.current.onTap();
    });
    act(() => result.current.dismiss());
    act(() => {
      for (let i = 0; i < 10; i++) result.current.onTap();
    });
    expect(result.current.active).toBe(true);
  });
});
