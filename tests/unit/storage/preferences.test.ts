import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadPreferences, savePreferences } from '@/storage/preferences';

beforeEach(() => AsyncStorage.clear());

describe('preferences', () => {
  // `system` n'est pas un pis-aller : tant que personne n'a choisi, l'application
  // suit l'appareil.
  it('suit le système par défaut', async () => {
    expect(await loadPreferences()).toEqual({ theme: 'system', language: 'system' });
  });

  it('retient le thème choisi', async () => {
    await savePreferences({ theme: 'dark', language: 'system' });
    expect((await loadPreferences()).theme).toBe('dark');
  });

  // Une valeur écrite par une version antérieure du format ne doit pas bloquer
  // l'application sur un thème qui n'existe plus.
  it('ignore un thème inconnu', async () => {
    await AsyncStorage.setItem('app_preferences', JSON.stringify({ theme: 'sepia' }));
    expect((await loadPreferences()).theme).toBe('system');
  });

  it('ignore un contenu illisible', async () => {
    await AsyncStorage.setItem('app_preferences', 'pas du JSON');
    expect((await loadPreferences()).theme).toBe('system');
  });
});
