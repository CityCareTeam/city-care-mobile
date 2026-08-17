import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadClustersCache, saveClustersCache } from '@/storage/map-cache';
import type { MapClusterDto } from '@/types/incidents';

function clusters(count: number): MapClusterDto[] {
  return Array.from({ length: count }, (_, index) => ({
    latitude: 45.75 + index / 100,
    longitude: 4.85,
    count: index + 1,
    reported: 1,
    in_progress: 0,
    resolved: index,
  }));
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('cache des regroupements', () => {
  it('ne rend rien quand rien n’a été enregistré', async () => {
    expect(await loadClustersCache(null, null)).toBeNull();
  });

  it('rend ce qui a été enregistré sous les mêmes filtres', async () => {
    await saveClustersCache(clusters(3), null, null);
    const cache = await loadClustersCache(null, null);

    expect(cache?.clusters).toHaveLength(3);
  });

  /**
   * Le point de la vérification des filtres. Ressortir les cellules « résolus »
   * sous un filtre « en cours » donnerait des comptes faux, et rien à l'écran
   * ne le dirait — l'utilisateur lirait des chiffres qui ne répondent pas à sa
   * question.
   */
  it('refuse un cache pris sous d’autres filtres', async () => {
    await saveClustersCache(clusters(3), 'resolved', null);

    expect(await loadClustersCache('in_progress', null)).toBeNull();
    expect(await loadClustersCache(null, null)).toBeNull();
    expect(await loadClustersCache('resolved', 'pothole')).toBeNull();
    expect(await loadClustersCache('resolved', null)).not.toBeNull();
  });

  it('oublie un état de plus de vingt-quatre heures', async () => {
    await saveClustersCache(clusters(2), null, null);

    const stored = JSON.parse((await AsyncStorage.getItem('map_clusters_cache')) as string);
    stored.savedAt = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    await AsyncStorage.setItem('map_clusters_cache', JSON.stringify(stored));

    expect(await loadClustersCache(null, null)).toBeNull();
  });

  it('ignore un contenu abîmé plutôt que de le servir', async () => {
    await AsyncStorage.setItem('map_clusters_cache', '{"clusters":"pas un tableau"}');
    expect(await loadClustersCache(null, null)).toBeNull();
  });
});
