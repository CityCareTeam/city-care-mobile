import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PREFERENCES, loadPreferences, savePreferences } from '@/storage/preferences';

beforeEach(() => AsyncStorage.clear());

describe('preferences', () => {
  // `system` n'est pas un pis-aller : tant que personne n'a choisi, l'application
  // suit l'appareil.
  it('suit le système par défaut', async () => {
    const loaded = await loadPreferences();
    expect(loaded.theme).toBe('system');
    expect(loaded.language).toBe('system');
  });

  /**
   * Le son commence désactivé et la vibration active. Une application qui se met
   * à sonner sans qu'on l'ait demandé se fait couper le volume, pas régler ; une
   * vibration, elle, est discrète et attendue.
   */
  it('vibre par défaut mais ne sonne pas', async () => {
    const loaded = await loadPreferences();
    expect(loaded.haptics).toBe(true);
    expect(loaded.sounds).toBe(false);
  });

  // `nearest` réclamerait la position avant qu'on ait rien demandé.
  it('ouvre le fil sur les plus récents', async () => {
    expect((await loadPreferences()).defaultSort).toBe('recent');
  });

  it('retient le thème choisi', async () => {
    await savePreferences({ ...DEFAULT_PREFERENCES, theme: 'dark' });
    expect((await loadPreferences()).theme).toBe('dark');
  });

  it('retient les retours et le tri', async () => {
    await savePreferences({
      ...DEFAULT_PREFERENCES,
      haptics: false,
      sounds: true,
      defaultSort: 'nearest',
    });

    const loaded = await loadPreferences();
    expect(loaded.haptics).toBe(false);
    expect(loaded.sounds).toBe(true);
    expect(loaded.defaultSort).toBe('nearest');
  });

  // Une valeur écrite par une version antérieure du format ne doit pas bloquer
  // l'application sur un thème qui n'existe plus.
  it('ignore un thème ou un tri inconnu', async () => {
    await AsyncStorage.setItem(
      'app_preferences',
      JSON.stringify({ theme: 'sepia', defaultSort: 'aléatoire' }),
    );

    const loaded = await loadPreferences();
    expect(loaded.theme).toBe('system');
    expect(loaded.defaultSort).toBe('recent');
  });

  /**
   * Les réglages arrivés après coup sont absents des enregistrements existants.
   * Sans repli explicite, `undefined` passerait pour « désactivé » — et la
   * vibration disparaîtrait chez tous ceux qui avaient déjà choisi un thème.
   */
  it('complète un enregistrement écrit avant que ces réglages existent', async () => {
    await AsyncStorage.setItem('app_preferences', JSON.stringify({ theme: 'dark' }));

    const loaded = await loadPreferences();
    expect(loaded.haptics).toBe(true);
    expect(loaded.sounds).toBe(false);
  });

  it('ignore un contenu illisible', async () => {
    await AsyncStorage.setItem('app_preferences', 'pas du JSON');
    expect((await loadPreferences()).theme).toBe('system');
  });
});
