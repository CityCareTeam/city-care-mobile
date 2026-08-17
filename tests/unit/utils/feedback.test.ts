const mockPlay = jest.fn();
const mockSeek = jest.fn(() => Promise.resolve());
const mockCreate = jest.fn(() => ({ play: mockPlay, seekTo: mockSeek, remove: jest.fn() }));

jest.mock('expo-audio', () => ({ createAudioPlayer: () => mockCreate() }));

const mockSelection = jest.fn(() => Promise.resolve());
const mockNotification = jest.fn(() => Promise.resolve());
const mockImpact = jest.fn(() => Promise.resolve());

jest.mock('expo-haptics', () => ({
  selectionAsync: () => mockSelection(),
  notificationAsync: () => mockNotification(),
  impactAsync: () => mockImpact(),
  NotificationFeedbackType: { Success: 'success' },
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

import { setFeedbackPreferences, succeeded, tapped, warned } from '@/utils/feedback';

beforeEach(() => {
  mockPlay.mockClear();
  mockCreate.mockClear();
  mockSelection.mockClear();
  mockNotification.mockClear();
  mockImpact.mockClear();
  // Les lecteurs sont gardés dans l'état du module, qui survit d'un test à
  // l'autre : couper le son les relâche et rend chaque test indépendant du
  // précédent.
  setFeedbackPreferences({ haptics: true, sounds: false });
});

describe('retours', () => {
  /**
   * Le son est éteint par défaut : une application qui se met à sonner sans
   * qu'on l'ait demandé se fait couper le volume, pas régler.
   */
  it('vibre sans sonner tant que le son n’est pas activé', () => {
    setFeedbackPreferences({ haptics: true, sounds: false });
    succeeded();

    expect(mockNotification).toHaveBeenCalled();
    expect(mockPlay).not.toHaveBeenCalled();
    // Aucun lecteur n'est même construit : celui qui laisse le son éteint ne
    // paie rien.
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('sonne et vibre quand les deux sont activés', () => {
    setFeedbackPreferences({ haptics: true, sounds: true });
    succeeded();

    expect(mockNotification).toHaveBeenCalled();
    expect(mockPlay).toHaveBeenCalled();
  });

  it('sonne sans vibrer quand la vibration est coupée', () => {
    setFeedbackPreferences({ haptics: false, sounds: true });
    tapped();

    expect(mockSelection).not.toHaveBeenCalled();
    expect(mockPlay).toHaveBeenCalled();
  });

  it('se tait complètement quand tout est coupé', () => {
    setFeedbackPreferences({ haptics: false, sounds: false });
    warned();

    expect(mockImpact).not.toHaveBeenCalled();
    expect(mockPlay).not.toHaveBeenCalled();
  });

  // Un lecteur par son, gardé : l'application rejouera les mêmes trois sons des
  // centaines de fois.
  it('ne construit qu’un lecteur par son', () => {
    setFeedbackPreferences({ haptics: true, sounds: true });
    tapped();
    tapped();
    tapped();

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockPlay).toHaveBeenCalledTimes(3);
  });

  it('relâche les lecteurs quand on coupe le son', () => {
    setFeedbackPreferences({ haptics: true, sounds: true });
    tapped();
    setFeedbackPreferences({ haptics: true, sounds: false });
    setFeedbackPreferences({ haptics: true, sounds: true });
    tapped();

    // Reconstruit : le précédent a été libéré entre-temps.
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});
