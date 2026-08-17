import type { LanguagePreference } from "@/constants/i18n";
import { readJson, writeJson } from "@/storage/local-store";

const KEY = "app_preferences";

/**
 * `system` n'est pas un pis-aller, c'est le défaut : l'application suit le
 * réglage de l'appareil tant que personne n'a demandé autre chose. Choisir
 * explicitement, c'est justement dire qu'on ne veut plus suivre.
 */
export type ThemePreference = "light" | "dark" | "system";

/**
 * Ordre du fil au premier affichage.
 *
 * `nearest` demande la position, et c'est pourquoi ce n'est pas le défaut : une
 * application qui réclame la géolocalisation avant qu'on lui ait rien demandé
 * commence mal. Le choisir ici, c'est le demander explicitement.
 */
export type SortPreference = "recent" | "oldest" | "nearest";

export type Preferences = {
  theme: ThemePreference;
  language: LanguagePreference;
  /** Retour haptique des gestes qui comptent. */
  haptics: boolean;
  /** Sons courts de l'interface, muets par défaut. */
  sounds: boolean;
  defaultSort: SortPreference;
};

/**
 * Le son est le seul de ces réglages à commencer désactivé.
 *
 * Une application qui se met à sonner sans qu'on l'ait demandé se fait couper
 * le volume, pas régler. La vibration, elle, est discrète et attendue.
 */
export const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  language: "system",
  haptics: true,
  sounds: false,
  defaultSort: "recent",
};

const THEMES: ThemePreference[] = ["light", "dark", "system"];
const LANGUAGES: LanguagePreference[] = ["fr", "en", "system"];
const SORTS: SortPreference[] = ["recent", "oldest", "nearest"];

/**
 * Réglages d'application — ceux qui n'appartiennent pas au compte.
 *
 * Le thème n'a rien à faire dans le profil : il ne suit pas l'utilisateur d'un
 * appareil à l'autre, il décrit ce téléphone-ci. D'où un stockage local et non
 * une préférence serveur.
 */
export async function loadPreferences(): Promise<Preferences> {
  const stored = await readJson<Partial<Preferences>>(KEY);
  const theme = stored?.theme;
  const language = stored?.language;
  return {
    // Une valeur écrite par une version antérieure du format ne doit pas
    // bloquer l'application sur un thème ou une langue qui n'existent plus —
    // ni sur `undefined`, pour les préférences enregistrées avant que la langue
    // n'existe.
    theme: THEMES.includes(theme as ThemePreference) ? (theme as ThemePreference) : "system",
    language: LANGUAGES.includes(language as LanguagePreference)
      ? (language as LanguagePreference)
      : "system",
    // Les réglages arrivés après coup sont absents des enregistrements
    // existants : on retombe sur le défaut plutôt que sur `undefined`, qui
    // passerait pour « désactivé » à la première lecture booléenne.
    haptics: typeof stored?.haptics === "boolean" ? stored.haptics : DEFAULT_PREFERENCES.haptics,
    sounds: typeof stored?.sounds === "boolean" ? stored.sounds : DEFAULT_PREFERENCES.sounds,
    defaultSort: SORTS.includes(stored?.defaultSort as SortPreference)
      ? (stored?.defaultSort as SortPreference)
      : DEFAULT_PREFERENCES.defaultSort,
  };
}

export async function savePreferences(preferences: Preferences): Promise<void> {
  await writeJson(KEY, preferences);
}
