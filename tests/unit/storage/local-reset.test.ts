import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearLocalData, ERASED_KEYS } from '@/storage/local-reset';

beforeEach(() => AsyncStorage.clear());

describe('clearLocalData', () => {
  it('efface tout ce qu’elle annonce', async () => {
    for (const key of ERASED_KEYS) {
      await AsyncStorage.setItem(key, JSON.stringify({ some: 'thing' }));
    }

    await clearLocalData();

    for (const key of ERASED_KEYS) {
      expect(await AsyncStorage.getItem(key)).toBeNull();
    }
  });

  /**
   * Les deux exclusions volontaires. Un bouton de ménage qui déconnecte est une
   * trappe ; et effacer les réglages rendrait le bouton hostile à celui qui
   * vient de les choisir, dans la fenêtre même où il les a choisis.
   */
  it('laisse les réglages tranquilles', async () => {
    await AsyncStorage.setItem('app_preferences', JSON.stringify({ theme: 'dark' }));

    await clearLocalData();

    expect(await AsyncStorage.getItem('app_preferences')).not.toBeNull();
  });

  it('couvre les brouillons des deux formats', async () => {
    // L'ancien format à brouillon unique traîne encore sur les installations qui
    // n'ont pas rouvert le formulaire depuis la migration.
    expect(ERASED_KEYS).toContain('report_draft');
    expect(ERASED_KEYS).toContain('report_drafts');
  });

  it('ne s’étouffe pas sur des clés déjà absentes', async () => {
    await expect(clearLocalData()).resolves.toBeUndefined();
  });
});
