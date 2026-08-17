import { readJson, writeJson } from "@/storage/local-store";
import type { MapClusterDto } from "@/types/incidents";

const KEY = "map_clusters_cache";

/** Même horizon que le fil : au-delà, la ville a trop changé pour qu'on l'affirme. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type ClustersCache = {
  clusters: MapClusterDto[];
  /** Les filtres actifs au moment de l'enregistrement. */
  filterStatus: string | null;
  filterType: string | null;
  savedAt: string;
};

/**
 * Dernier regroupement connu de la carte.
 *
 * Les épingles ont leur cache — c'est celui du fil, même endpoint, même page.
 * Les regroupements n'en avaient pas, et ce sont eux qu'on voit en arrivant :
 * dézoomé, hors ligne, la carte s'ouvrait vide alors que le fil, lui, savait
 * quoi montrer.
 *
 * On ne garde pas la région d'origine, à dessein : des regroupements sont des
 * points géolocalisés, les afficher sur une carte reste juste où qu'elle soit
 * — ceux d'ailleurs sortent simplement du cadre. Les **filtres**, eux, sont
 * gardés et vérifiés : ressortir les cellules « résolus » sous un filtre « en
 * cours » donnerait des comptes faux, et rien ne le dirait.
 */
export async function saveClustersCache(
  clusters: MapClusterDto[],
  filterStatus: string | null,
  filterType: string | null,
): Promise<void> {
  await writeJson(KEY, {
    clusters,
    filterStatus,
    filterType,
    savedAt: new Date().toISOString(),
  } satisfies ClustersCache);
}

/** Le cache s'il est exploitable sous ces filtres-là, `null` sinon. */
export async function loadClustersCache(
  filterStatus: string | null,
  filterType: string | null,
): Promise<ClustersCache | null> {
  const cache = await readJson<ClustersCache>(KEY);
  if (!cache || !Array.isArray(cache.clusters) || typeof cache.savedAt !== "string") return null;

  const age = Date.now() - new Date(cache.savedAt).getTime();
  if (!Number.isFinite(age) || age > MAX_AGE_MS) return null;

  const sameFilters =
    (cache.filterStatus ?? null) === filterStatus && (cache.filterType ?? null) === filterType;
  if (!sameFilters) return null;

  return cache;
}
