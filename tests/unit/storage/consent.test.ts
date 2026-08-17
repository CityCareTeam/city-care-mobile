import AsyncStorage from '@react-native-async-storage/async-storage';
import { locationAsked, markLocationAsked } from '@/storage/consent';

beforeEach(() => AsyncStorage.clear());

describe('trace du consentement', () => {
  it('n’a rien été demandé au départ', async () => {
    expect(await locationAsked()).toBe(false);
  });

  /**
   * Toute la raison d'être de ce fichier : `location: false` peut vouloir dire
   * « j'ai refusé » comme « on ne m'a rien demandé ». Sans cette trace,
   * l'application reposerait la question à chaque lancement à quelqu'un qui a
   * déjà dit non — ce qui n'est plus demander mais insister.
   */
  it('retient qu’on a posé la question, quelle qu’ait été la réponse', async () => {
    await markLocationAsked();
    expect(await locationAsked()).toBe(true);
  });

  it('garde la date, pas la réponse', async () => {
    await markLocationAsked();
    const stored = JSON.parse((await AsyncStorage.getItem('consent')) as string);

    expect(Object.keys(stored)).toEqual(['locationAskedAt']);
    expect(Number.isFinite(new Date(stored.locationAskedAt).getTime())).toBe(true);
  });

  it('ignore un contenu abîmé et repose la question', async () => {
    await AsyncStorage.setItem('consent', '{"locationAskedAt":42}');
    expect(await locationAsked()).toBe(false);
  });
});
