import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearDraft, isWorthSaving, loadDraft, saveDraft } from '@/storage/report-draft';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const draft = {
  latitude: 45.75,
  longitude: 4.85,
  addressQuery: '12 rue Victor-Hugo',
  description: 'Nid-de-poule',
  type: 'Road' as const,
  photos: [{ uri: 'file:///photo.jpg', fileName: 'photo.jpg', mimeType: 'image/jpeg' }],
};

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.useRealTimers();
});

describe('report-draft', () => {
  it('ne rend rien quand il n’y a pas de brouillon', async () => {
    expect(await loadDraft()).toBeNull();
  });

  it('rend le brouillon tel qu’il a été enregistré', async () => {
    await saveDraft(draft);
    const loaded = await loadDraft();
    expect(loaded).toMatchObject(draft);
    expect(typeof loaded?.savedAt).toBe('string');
  });

  it('oublie le brouillon après envoi', async () => {
    await saveDraft(draft);
    await clearDraft();
    expect(await loadDraft()).toBeNull();
  });

  // Retrouver dix jours plus tard un formulaire devant un trou sans doute déjà
  // rebouché n'aide personne — et les photos auront disparu du cache.
  it('laisse tomber un brouillon trop vieux', async () => {
    await AsyncStorage.setItem(
      'report_draft',
      JSON.stringify({ ...draft, savedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() }),
    );
    expect(await loadDraft()).toBeNull();
    // Et il ne traîne pas : la lecture l'a effacé au passage.
    expect(await AsyncStorage.getItem('report_draft')).toBeNull();
  });

  it('ignore un contenu illisible plutôt que d’échouer', async () => {
    await AsyncStorage.setItem('report_draft', '{ ceci n’est pas du JSON');
    expect(await loadDraft()).toBeNull();
  });

  it('ignore un brouillon sans date', async () => {
    await AsyncStorage.setItem('report_draft', JSON.stringify({ description: 'orphelin' }));
    expect(await loadDraft()).toBeNull();
  });
});

describe('isWorthSaving', () => {
  const empty = { ...draft, description: '', type: null, photos: [] };

  // Un formulaire vierge n'est pas un brouillon : il n'y aurait rien à proposer
  // de restaurer au prochain passage.
  it('refuse un formulaire vierge', () => {
    expect(isWorthSaving(empty)).toBe(false);
  });

  it('refuse une description qui n’est que des espaces', () => {
    expect(isWorthSaving({ ...empty, description: '   ' })).toBe(false);
  });

  it('retient dès qu’une catégorie est choisie', () => {
    expect(isWorthSaving({ ...empty, type: 'Waste' })).toBe(true);
  });

  it('retient dès qu’une photo est prise', () => {
    expect(isWorthSaving({ ...empty, photos: draft.photos })).toBe(true);
  });
});
