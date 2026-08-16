import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearAllDrafts,
  clearDraft,
  isWorthSaving,
  latestDraft,
  listDrafts,
  saveDraft,
} from '@/storage/report-draft';

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

/** Deux enregistrements dans la même milliseconde seraient impossibles à ordonner. */
const tick = () => new Promise((resolve) => setTimeout(resolve, 2));

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.useRealTimers();
});

describe('report-draft', () => {
  it('ne rend rien quand il n’y a pas de brouillon', async () => {
    expect(await latestDraft()).toBeNull();
  });

  it('rend le brouillon tel qu’il a été enregistré', async () => {
    await saveDraft(draft);
    const loaded = await latestDraft();
    expect(loaded).toMatchObject(draft);
    expect(typeof loaded?.savedAt).toBe('string');
    expect(typeof loaded?.id).toBe('string');
  });

  it('oublie le brouillon après envoi', async () => {
    const id = await saveDraft(draft);
    await clearDraft(id);
    expect(await latestDraft()).toBeNull();
  });

  // Le cœur des brouillons multiples : réenregistrer sous le même identifiant
  // écrase ; sans identifiant, on en ouvre un autre.
  it('écrase sous le même identifiant', async () => {
    const id = await saveDraft(draft);
    await saveDraft({ ...draft, description: 'Corrigé' }, id);
    const all = await listDrafts();
    expect(all).toHaveLength(1);
    expect(all[0].description).toBe('Corrigé');
  });

  it('en garde plusieurs, du plus récent au plus ancien', async () => {
    await saveDraft({ ...draft, description: 'Premier' });
    await tick();
    await saveDraft({ ...draft, description: 'Second' });
    expect((await listDrafts()).map((d) => d.description)).toEqual(['Second', 'Premier']);
  });

  it('ne supprime que celui qu’on désigne', async () => {
    const first = await saveDraft({ ...draft, description: 'Premier' });
    await tick();
    await saveDraft({ ...draft, description: 'Second' });
    await clearDraft(first);
    expect((await listDrafts()).map((d) => d.description)).toEqual(['Second']);
  });

  // Une liste sans fin deviendrait un cimetière à ranger à la main.
  it('plafonne à cinq, le plus ancien cédant la place', async () => {
    for (let i = 0; i < 7; i++) {
      await saveDraft({ ...draft, description: `n${i}` });
      await tick();
    }
    const all = await listDrafts();
    expect(all).toHaveLength(5);
    expect(all.map((d) => d.description)).not.toContain('n0');
    expect(all.map((d) => d.description)).toContain('n6');
  });

  // Sans reprise, la mise à jour aurait fait disparaître le travail en cours de
  // tous ceux qui avaient un formulaire ouvert — exactement ce que les
  // brouillons existent pour éviter.
  it('reprend le brouillon unique de l’ancienne version', async () => {
    await clearAllDrafts();
    await AsyncStorage.setItem(
      'report_draft',
      JSON.stringify({ ...draft, savedAt: new Date().toISOString() }),
    );

    const all = await listDrafts();
    expect(all).toHaveLength(1);
    expect(all[0].description).toBe('Nid-de-poule');
    expect(typeof all[0].id).toBe('string');
    // L'ancienne clé est libérée : on ne le reprend pas deux fois.
    expect(await AsyncStorage.getItem('report_draft')).toBeNull();
  });

  // Retrouver dix jours plus tard un formulaire devant un trou sans doute déjà
  // rebouché n'aide personne — et les photos auront disparu du cache.
  it('laisse tomber un brouillon trop vieux', async () => {
    await AsyncStorage.setItem(
      'report_drafts',
      JSON.stringify([
        { ...draft, id: 'vieux', savedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() },
      ]),
    );

    expect(await latestDraft()).toBeNull();
    // Et il ne traîne pas : la lecture a purgé la liste au passage.
    expect(JSON.parse((await AsyncStorage.getItem('report_drafts')) ?? '[]')).toEqual([]);
  });

  it('garde les frais et écarte les vieux', async () => {
    await AsyncStorage.setItem(
      'report_drafts',
      JSON.stringify([
        { ...draft, id: 'frais', description: 'Frais', savedAt: new Date().toISOString() },
        { ...draft, id: 'vieux', description: 'Vieux', savedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() },
      ]),
    );
    expect((await listDrafts()).map((d) => d.description)).toEqual(['Frais']);
  });

  it('ignore un contenu illisible plutôt que d’échouer', async () => {
    await AsyncStorage.setItem('report_drafts', '{ ceci n’est pas du JSON');
    expect(await latestDraft()).toBeNull();
  });

  it('ignore un brouillon sans date', async () => {
    await AsyncStorage.setItem('report_drafts', JSON.stringify([{ description: 'orphelin' }]));
    expect(await latestDraft()).toBeNull();
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
