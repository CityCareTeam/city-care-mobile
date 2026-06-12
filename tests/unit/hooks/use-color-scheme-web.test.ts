import { renderHook, act } from '@testing-library/react-native';
import * as RN from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme.web';

describe('useColorScheme (web)', () => {
  let spy: jest.SpyInstance;

  beforeEach(() => {
    spy = jest.spyOn(RN, 'useColorScheme');
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('returns "dark" after hydration when system scheme is dark', () => {
    spy.mockReturnValue('dark');
    const { result } = renderHook(() => useColorScheme());
    expect(result.current).toBe('dark');
  });

  it('returns "light" after hydration when system scheme is light', () => {
    spy.mockReturnValue('light');
    const { result } = renderHook(() => useColorScheme());
    expect(result.current).toBe('light');
  });

  it('returns null after hydration when system has no preference', () => {
    spy.mockReturnValue(null);
    const { result } = renderHook(() => useColorScheme());
    expect(result.current).toBeNull();
  });

  it('scheme updates when system preference changes at runtime', () => {
    spy.mockReturnValue('light');
    const { result, rerender } = renderHook(() => useColorScheme());
    expect(result.current).toBe('light');

    spy.mockReturnValue('dark');
    act(() => rerender({}));
    expect(result.current).toBe('dark');
  });
});
