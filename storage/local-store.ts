import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Lecture et écriture JSON sur le stockage local.
 *
 * Trois usages s'y appuient — le brouillon de signalement, le cache du fil et
 * la file d'envoi — et tous partagent la même règle : **rien de tout cela ne
 * doit jamais faire échouer l'appel qui l'utilise.** Un disque plein, une
 * valeur corrompue par une version précédente du format, et l'écran entier
 * tomberait pour un confort. On avale donc l'erreur et on rend `null` : au pire
 * l'utilisateur retrouve l'application telle qu'elle était avant qu'on ajoute
 * du hors-ligne.
 *
 * `expo-secure-store` reste réservé aux jetons (`storage/tokens.ts`) : il est
 * chiffré, mais borné en taille et lent — le mauvais outil pour du volume.
 */

export async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Rien à faire : la prochaine écriture réessaiera.
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Idem — une clé qu'on n'a pas pu effacer sera écrasée à la prochaine.
  }
}
