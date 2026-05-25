import { renderHook } from '@testing-library/react-native';
import { useAppColors } from '@/hooks/use-app-colors';
import { CityCareColors, CityCareColorsDark } from '@/constants/theme';

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useColorScheme } = require('@/hooks/use-color-scheme') as { useColorScheme: jest.Mock };

describe('useAppColors', () => {
  it('returns light colors when scheme is light', () => {
    useColorScheme.mockReturnValue('light');
    const { result } = renderHook(() => useAppColors());
    expect(result.current.isDark).toBe(false);
    expect(result.current.colors).toEqual(CityCareColors);
  });

  it('returns dark colors when scheme is dark', () => {
    useColorScheme.mockReturnValue('dark');
    const { result } = renderHook(() => useAppColors());
    expect(result.current.isDark).toBe(true);
    expect(result.current.colors).toEqual(CityCareColorsDark);
  });

  it('returns light colors when scheme is null (no preference)', () => {
    useColorScheme.mockReturnValue(null);
    const { result } = renderHook(() => useAppColors());
    expect(result.current.isDark).toBe(false);
    expect(result.current.colors).toEqual(CityCareColors);
  });

  it('dark colors have same keys as light colors', () => {
    useColorScheme.mockReturnValue('dark');
    const { result } = renderHook(() => useAppColors());
    expect(Object.keys(result.current.colors)).toEqual(Object.keys(CityCareColors));
  });

  it('primary color is identical in both themes', () => {
    useColorScheme.mockReturnValue('dark');
    const { result: dark } = renderHook(() => useAppColors());
    useColorScheme.mockReturnValue('light');
    const { result: light } = renderHook(() => useAppColors());
    expect(dark.current.colors.primary).toBe(light.current.colors.primary);
  });
});
