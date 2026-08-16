import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ThemePreference } from '@/storage/preferences';
import { renderHook } from '@testing-library/react-native';
import * as RN from 'react-native';

let mockPreference: ThemePreference = 'system';
jest.mock('@/context/PreferencesContext', () => ({
  usePreferences: () => ({ theme: mockPreference, setTheme: () => {}, loading: false }),
}));

let system: jest.SpyInstance;

beforeEach(() => {
  mockPreference = 'system';
  system = jest.spyOn(RN, 'useColorScheme');
});

afterEach(() => system.mockRestore());

describe('useColorScheme', () => {
  it('suit le système quand personne n’a choisi', () => {
    system.mockReturnValue('dark');
    expect(renderHook(() => useColorScheme()).result.current).toBe('dark');
  });

  // Choisir explicitement, c'est dire qu'on ne veut plus suivre l'appareil.
  it('le choix de l’utilisateur l’emporte sur le système', () => {
    system.mockReturnValue('dark');
    mockPreference = 'light';
    expect(renderHook(() => useColorScheme()).result.current).toBe('light');
  });

  it('force le sombre sur un téléphone en clair', () => {
    system.mockReturnValue('light');
    mockPreference = 'dark';
    expect(renderHook(() => useColorScheme()).result.current).toBe('dark');
  });

  // Le système peut ne rien dire : les écrans, eux, ont besoin d'une valeur.
  it('retombe sur le clair quand le système ne se prononce pas', () => {
    system.mockReturnValue(null);
    expect(renderHook(() => useColorScheme()).result.current).toBe('light');
  });
});
