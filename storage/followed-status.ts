import { readJson, writeJson } from "@/storage/local-store";

const KEY = "followed_status";

/**
 * Dernier statut connu des signalements suivis.
 *
 * Gardé sur le disque et non en mémoire : un changement survenu pendant que
 * l'application était fermée doit se voir à la réouverture. C'est même le cas le
 * plus fréquent — une mairie ne traite pas un signalement pendant les quinze
 * secondes où l'on regarde son téléphone.
 */
export type KnownStatuses = Record<string, string>;

export async function loadKnownStatuses(): Promise<KnownStatuses> {
  const stored = await readJson<KnownStatuses>(KEY);
  return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
}

export async function saveKnownStatuses(statuses: KnownStatuses): Promise<void> {
  await writeJson(KEY, statuses);
}
