import { readJson, writeJson } from "@/storage/local-store";
import type { IncidentResponse } from "@/types/incidents";

const KEY = "incidents_cache";

/**
 * Au-delà, on préfère l'écran vide au mensonge : une carte de signalements
 * vieille d'une semaine donnerait une image fausse de la ville.
 */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Ce qu'on garde : la première page, pas les suivantes. */
const MAX_ENTRIES = 50;

export type IncidentsCache = {
  incidents: IncidentResponse[];
  totalCount: number;
  savedAt: string;
};

/**
 * Dernier état connu du fil.
 *
 * Il ne sert qu'à une chose : avoir quelque chose à montrer avant que le
 * réseau réponde, et à la place de l'écran vide quand il ne répond pas. Il ne
 * remplace jamais une réponse fraîche — dès qu'elle arrive, elle prend la
 * main.
 *
 * Seul le fil public est mis en cache. « Mes signalements » ne l'est pas : ce
 * sont des données rattachées à un compte, et le stockage local, lui, n'est
 * rattaché à personne — deux comptes sur le même téléphone verraient les
 * signalements l'un de l'autre.
 */
export async function saveIncidentsCache(
  incidents: IncidentResponse[],
  totalCount: number,
): Promise<void> {
  await writeJson(KEY, {
    incidents: incidents.slice(0, MAX_ENTRIES),
    totalCount,
    savedAt: new Date().toISOString(),
  });
}

/** Le cache, ou `null` s'il n'y en a pas — ou s'il est trop vieux pour être montré. */
export async function loadIncidentsCache(): Promise<IncidentsCache | null> {
  const cache = await readJson<IncidentsCache>(KEY);
  if (!cache || !Array.isArray(cache.incidents) || typeof cache.savedAt !== "string") {
    return null;
  }

  const age = Date.now() - new Date(cache.savedAt).getTime();
  if (!Number.isFinite(age) || age > MAX_AGE_MS) return null;

  return cache;
}
