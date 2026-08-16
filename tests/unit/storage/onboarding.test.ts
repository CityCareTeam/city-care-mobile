import AsyncStorage from '@react-native-async-storage/async-storage';
import { GUIDE_EDITION, hasSeenGuide, markGuideSeen } from '@/storage/onboarding';

beforeEach(() => AsyncStorage.clear());

describe('onboarding', () => {
  it('n’a rien vu sur un appareil neuf', async () => {
    expect(await hasSeenGuide()).toBe(false);
  });

  it('retient que le guide a été montré', async () => {
    await markGuideSeen();
    expect(await hasSeenGuide()).toBe(true);
  });

  // C'est tout l'intérêt du numéro d'édition : un guide enrichi peut être
  // remontré une fois, sans l'imposer à chaque mise à jour.
  it('remontre le guide après une nouvelle édition', async () => {
    await AsyncStorage.setItem('onboarding', JSON.stringify({ seenEdition: GUIDE_EDITION - 1 }));
    expect(await hasSeenGuide()).toBe(false);
  });

  it('ne remontre rien à une édition plus récente que la nôtre', async () => {
    await AsyncStorage.setItem('onboarding', JSON.stringify({ seenEdition: GUIDE_EDITION + 1 }));
    expect(await hasSeenGuide()).toBe(true);
  });

  it('ignore un contenu illisible', async () => {
    await AsyncStorage.setItem('onboarding', 'pas du JSON');
    expect(await hasSeenGuide()).toBe(false);
  });
});
