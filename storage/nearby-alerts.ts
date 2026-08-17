import { readJson, writeJson } from "@/storage/local-store";

const KEY = "nearby_announced";

/**
 * Assez pour couvrir plusieurs semaines de voisinage, assez peu pour que la
 * liste reste une liste. Au-delà, les plus anciens sortent : un signalement
 * annoncé il y a deux cents notifications a été vu ou oublié, le réannoncer est
 * un risque théorique.
 */
const MAX_REMEMBERED = 200;

/**
 * Signalements dont on a déjà prévenu.
 *
 * Sur l'appareil et non sur le compte, comme tout ce qui décrit ce téléphone-ci :
 * ce sont ses notifications à lui qui sont parties. Deux téléphones du même
 * utilisateur préviennent chacun une fois, ce qui est exactement ce qu'on veut —
 * on ne sait pas lequel il avait en poche.
 */
export async function loadAnnounced(): Promise<Set<string>> {
  const stored = await readJson<string[]>(KEY);
  return new Set(Array.isArray(stored) ? stored : []);
}

/** Ajoute au souvenir, en gardant les plus récents. */
export async function remember(ids: string[]): Promise<Set<string>> {
  const known = await loadAnnounced();
  // Les nouveaux en fin de liste : c'est l'ordre qui décide qui sort quand on
  // tronque.
  const all = [...known, ...ids.filter((id) => !known.has(id))];
  const kept = all.slice(-MAX_REMEMBERED);
  await writeJson(KEY, kept);
  return new Set(kept);
}
