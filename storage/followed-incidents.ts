import { readJson, writeJson } from "@/storage/local-store";

const KEY = "followed_incidents";

/**
 * Signalements suivis.
 *
 * On ne peut suivre que ce qu'on a déclaré soi-même : le nid-de-poule devant
 * chez soi signalé par un voisin, on le perd de vue dès qu'il descend dans le
 * fil. C'est ce que cette liste répare.
 *
 * **Purement locale, et c'est un choix.** Le serveur n'a pas de notion
 * d'abonnement, et lui en ajouter une supposait de toucher au back. Le prix est
 * qu'un suivi ne migre pas d'un téléphone à l'autre — acceptable pour un repère
 * personnel, qui a de toute façon plus de sens sur l'appareil qu'on a en poche.
 *
 * On stocke des identifiants, jamais les incidents eux-mêmes : leur statut
 * change, et une copie locale vieillirait en silence.
 */
export async function listFollowed(): Promise<string[]> {
  const stored = await readJson<string[]>(KEY);
  return Array.isArray(stored) ? stored.filter((id) => typeof id === "string") : [];
}

/** Bascule le suivi, et renvoie l'état obtenu — ce que l'appelant veut afficher. */
export async function toggleFollowed(id: string): Promise<boolean> {
  const followed = await listFollowed();
  const isFollowed = followed.includes(id);

  await writeJson(KEY, isFollowed ? followed.filter((other) => other !== id) : [...followed, id]);
  return !isFollowed;
}

export async function isFollowed(id: string): Promise<boolean> {
  return (await listFollowed()).includes(id);
}
