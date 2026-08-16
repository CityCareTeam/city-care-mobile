import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadIncidentsCache, saveIncidentsCache } from '@/storage/incidents-cache';
import type { IncidentResponse } from '@/types/incidents';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const incidents = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ id: `inc-${i}` })) as IncidentResponse[];

beforeEach(() => AsyncStorage.clear());

describe('incidents-cache', () => {
  it('ne rend rien tant que rien n’a été mis en cache', async () => {
    expect(await loadIncidentsCache()).toBeNull();
  });

  it('rend les incidents et le total du serveur', async () => {
    await saveIncidentsCache(incidents(3), 137);
    const cache = await loadIncidentsCache();
    expect(cache?.incidents).toHaveLength(3);
    expect(cache?.totalCount).toBe(137);
  });

  // Le cache est là pour remplacer un écran vide, pas pour retenir tout le fil.
  it('ne garde que la première page', async () => {
    await saveIncidentsCache(incidents(120), 120);
    const cache = await loadIncidentsCache();
    expect(cache?.incidents).toHaveLength(50);
  });

  // Une carte de signalements vieille d'une semaine donnerait une image fausse
  // de la ville : mieux vaut l'écran vide.
  it('refuse un cache de plus d’un jour', async () => {
    await AsyncStorage.setItem(
      'incidents_cache',
      JSON.stringify({
        incidents: incidents(2),
        totalCount: 2,
        savedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      }),
    );
    expect(await loadIncidentsCache()).toBeNull();
  });

  it('accepte un cache de quelques heures', async () => {
    await AsyncStorage.setItem(
      'incidents_cache',
      JSON.stringify({
        incidents: incidents(2),
        totalCount: 2,
        savedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      }),
    );
    expect(await loadIncidentsCache()).not.toBeNull();
  });

  it('ignore un cache illisible plutôt que d’échouer', async () => {
    await AsyncStorage.setItem('incidents_cache', 'pas du JSON');
    expect(await loadIncidentsCache()).toBeNull();
  });

  it('ignore un cache d’une forme inattendue', async () => {
    await AsyncStorage.setItem('incidents_cache', JSON.stringify({ incidents: 'oups' }));
    expect(await loadIncidentsCache()).toBeNull();
  });
});
