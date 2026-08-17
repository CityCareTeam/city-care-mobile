import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearHidden, hide, loadHidden, unhide } from '@/storage/hidden-content';

beforeEach(() => AsyncStorage.clear());

describe('contenus masqués', () => {
  it('ne masque rien au départ', async () => {
    expect(await loadHidden()).toEqual({ incidents: [], messages: [] });
  });

  it('retient ce qu’on masque', async () => {
    await hide('incidents', 'abc');
    expect((await loadHidden()).incidents).toEqual(['abc']);
  });

  /**
   * Deux listes et non une : un identifiant de message et un identifiant de
   * signalement pourraient coïncider, et masquer l'un ferait alors disparaître
   * l'autre.
   */
  it('ne confond pas un message et un signalement de même identifiant', async () => {
    await hide('messages', 'même-id');

    const hidden = await loadHidden();
    expect(hidden.messages).toEqual(['même-id']);
    expect(hidden.incidents).toEqual([]);
  });

  it('ne double pas une entrée déjà masquée', async () => {
    await hide('incidents', 'abc');
    await hide('incidents', 'abc');
    expect((await loadHidden()).incidents).toEqual(['abc']);
  });

  // Masquer d'un appui sans pouvoir revenir transforme une maladresse en perte.
  it('remontre ce qu’on avait masqué', async () => {
    await hide('incidents', 'abc');
    await hide('incidents', 'def');
    await unhide('incidents', 'abc');

    expect((await loadHidden()).incidents).toEqual(['def']);
  });

  it('ne s’étouffe pas en démasquant ce qui ne l’était pas', async () => {
    await expect(unhide('messages', 'jamais-vu')).resolves.toBeDefined();
  });

  it('ignore un contenu abîmé plutôt que de planter', async () => {
    await AsyncStorage.setItem('hidden_content', '{"incidents":"pas un tableau"}');
    expect(await loadHidden()).toEqual({ incidents: [], messages: [] });
  });

  it('sait tout oublier', async () => {
    await hide('incidents', 'abc');
    await clearHidden();
    expect((await loadHidden()).incidents).toEqual([]);
  });
});
