import { removeKey } from "@/storage/local-store";

/**
 * Ce que « effacer les données locales » efface — et surtout ce qu'il n'efface
 * pas.
 *
 * Tout ce que l'application garde sur l'appareil finissait par s'empiler sans
 * qu'aucun écran ne permette d'y faire le ménage : brouillons oubliés, favoris
 * d'un ancien usage, caches d'une ville qu'on a quittée.
 *
 * Deux exclusions volontaires. Les **jetons de session** restent : un bouton de
 * ménage qui déconnecte est une trappe, personne ne s'y attend. Et les
 * **réglages** restent aussi — thème, langue, retours : les effacer rendrait le
 * bouton hostile à celui qui vient de les choisir, dans la fenêtre même où il
 * les a choisis.
 *
 * Les signalements en attente d'envoi, en revanche, partent : ils appartiennent
 * à cet appareil et à personne d'autre, et l'écran d'accueil dit combien il en
 * reste avant qu'on appuie.
 */
const ERASED = [
  "followed_incidents",
  "followed_status",
  "incidents_cache",
  "map_clusters_cache",
  "news_cache",
  "news_city",
  "onboarding",
  "pending_reports",
  "rejected_reports",
  // Ancien format de brouillon unique, encore présent sur les installations qui
  // n'ont jamais rouvert le formulaire depuis la migration.
  "report_draft",
  "report_drafts",
  "weather_cache",
] as const;

/** Clés que l'on garde, listées pour que la décision soit lisible ici aussi. */
export const KEPT = ["app_preferences", "auth tokens (expo-secure-store)"] as const;

export async function clearLocalData(): Promise<void> {
  // En parallèle : ce sont douze suppressions indépendantes, et l'utilisateur
  // attend devant un indicateur.
  await Promise.all(ERASED.map((key) => removeKey(key)));
}

/** Pour les tests, et pour qui voudrait afficher la liste. */
export const ERASED_KEYS: readonly string[] = ERASED;
