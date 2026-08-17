import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadAnnounced, remember } from '@/storage/nearby-alerts';

beforeEach(() => AsyncStorage.clear());

describe('souvenir des alertes de proximité', () => {
  it('ne se souvient de rien au départ', async () => {
    expect((await loadAnnounced()).size).toBe(0);
  });

  it('retient ce dont on a prévenu', async () => {
    await remember(['a', 'b']);
    const known = await loadAnnounced();

    expect(known.has('a')).toBe(true);
    expect(known.has('b')).toBe(true);
  });

  // Prévenir deux fois du même signalement est le défaut le plus visible d'une
  // alerte de proximité.
  it('n’enregistre pas deux fois le même', async () => {
    await remember(['a']);
    await remember(['a', 'b']);

    const stored = JSON.parse((await AsyncStorage.getItem('nearby_announced')) as string);
    expect(stored).toEqual(['a', 'b']);
  });

  /**
   * La liste est bornée : un signalement annoncé il y a deux cents
   * notifications a été vu ou oublié, et le réannoncer est un risque théorique
   * — là où une liste qui grossit sans fin est un problème certain.
   */
  it('oublie les plus anciens au-delà de deux cents', async () => {
    await remember(Array.from({ length: 250 }, (_, i) => `id-${i}`));
    const known = await loadAnnounced();

    expect(known.size).toBe(200);
    expect(known.has('id-249')).toBe(true);
    expect(known.has('id-0')).toBe(false);
  });

  it('ignore un contenu abîmé plutôt que de planter', async () => {
    await AsyncStorage.setItem('nearby_announced', '{"pas":"un tableau"}');
    expect((await loadAnnounced()).size).toBe(0);
  });
});
