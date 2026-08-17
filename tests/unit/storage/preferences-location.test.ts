import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PREFERENCES, loadPreferences, savePreferences } from '@/storage/preferences';

beforeEach(() => AsyncStorage.clear());

describe('réglage de localisation', () => {
  // Autorisée par défaut : l'application s'en sert pour à peu près tout, et la
  // couper doit être un choix, pas un état initial silencieux.
  it('est autorisée par défaut', async () => {
    expect((await loadPreferences()).location).toBe(true);
  });

  it('retient qu’on l’a coupée', async () => {
    await savePreferences({ ...DEFAULT_PREFERENCES, location: false });
    expect((await loadPreferences()).location).toBe(false);
  });

  /**
   * Le piège des réglages ajoutés après coup : sans repli explicite, `undefined`
   * passe pour « désactivé » à la première lecture booléenne — et la
   * localisation se serait coupée d'elle-même chez tous ceux qui avaient déjà
   * choisi un thème.
   */
  it('reste autorisée sur un enregistrement écrit avant son existence', async () => {
    await AsyncStorage.setItem('app_preferences', JSON.stringify({ theme: 'dark' }));
    expect((await loadPreferences()).location).toBe(true);
  });

  it('ignore une valeur qui n’est pas un booléen', async () => {
    await AsyncStorage.setItem('app_preferences', JSON.stringify({ location: 'non' }));
    expect((await loadPreferences()).location).toBe(true);
  });
});
