import type { LanguagePreference } from "@/constants/i18n";
import { readJson, writeJson } from "@/storage/local-store";

const KEY = "app_preferences";

/**
 * `system` n'est pas un pis-aller, c'est le défaut : l'application suit le
 * réglage de l'appareil tant que personne n'a demandé autre chose. Choisir
 * explicitement, c'est justement dire qu'on ne veut plus suivre.
 */
export type ThemePreference = "light" | "dark" | "system";

export type Preferences = {
  theme: ThemePreference;
  language: LanguagePreference;
};

export const DEFAULT_PREFERENCES: Preferences = { theme: "system", language: "system" };

const THEMES: ThemePreference[] = ["light", "dark", "system"];
const LANGUAGES: LanguagePreference[] = ["fr", "en", "system"];

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
  };
}

export async function savePreferences(preferences: Preferences): Promise<void> {
  await writeJson(KEY, preferences);
}
