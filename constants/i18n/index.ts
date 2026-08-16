import { en } from "@/constants/i18n/en";
import { fr } from "@/constants/i18n/fr";

export type Dictionary = typeof fr;
export type Language = "fr" | "en";
/** `system` suit la langue du téléphone, comme le thème suit son apparence. */
export type LanguagePreference = Language | "system";

const DICTIONARIES: Record<Language, Dictionary> = { fr, en };

/**
 * Langue de l'appareil, sans dépendance native.
 *
 * `expo-localization` aurait fait l'affaire, mais c'est un module natif : il
 * aurait imposé un nouvel APK et une génération de plus, donc empêché la
 * traduction elle-même de partir par mise à jour à la volée. `Intl` est fourni
 * par Hermes et suffit à lire la locale.
 *
 * Tout ce qui n'est pas anglais retombe sur le français : c'est la langue de la
 * ville, et une locale inconnue est plus probablement francophone qu'anglophone
 * pour cette application.
 */
export function deviceLanguage(): Language {
  try {
    const locale = new Intl.DateTimeFormat().resolvedOptions().locale ?? "";
    return locale.toLowerCase().startsWith("en") ? "en" : "fr";
  } catch {
    return "fr";
  }
}

export function resolveLanguage(preference: LanguagePreference): Language {
  return preference === "system" ? deviceLanguage() : preference;
}

export function dictionaryFor(preference: LanguagePreference): Dictionary {
  return DICTIONARIES[resolveLanguage(preference)];
}

// ─── Accès hors composant ────────────────────────────────────────────────────
//
// Les services, les alertes et les gestionnaires d'événements ont besoin des
// textes sans pouvoir appeler un crochet. Ils lisent donc la langue active, que
// `PreferencesContext` tient à jour — la valeur est relue à chaque accès, jamais
// capturée à l'import.

let active: Dictionary = fr;

export function setActiveLanguage(preference: LanguagePreference): void {
  active = dictionaryFor(preference);
}

export function getStrings(): Dictionary {
  return active;
}

/**
 * Table de libellés qui suit la langue active.
 *
 * Un relais qui n'intercepte que la lecture d'une clé **paraît** être un objet
 * sans en être un : `Object.keys()` et `Object.entries()` le voient vide, parce
 * qu'il n'a réellement aucune propriété. C'est ce qui avait vidé le filtre par
 * type de la carte et la liste des types suivis — les libellés s'affichaient
 * partout où on les demandait un par un, et nulle part où on les énumérait.
 *
 * Les trois pièges sont donc traités ensemble : lire une clé, les énumérer, et
 * les décrire — `Object.keys` exige le descripteur pour retenir une clé.
 */
export function languageAwareLabels(
  select: (dictionary: Dictionary) => Record<string, string>,
): Record<string, string> {
  const resolve = (key: string) => select(getStrings())[key];

  return new Proxy(
    {},
    {
      get: (_target, key: string) => resolve(key),
      has: (_target, key: string) => key in select(getStrings()),
      ownKeys: () => Reflect.ownKeys(select(getStrings())),
      getOwnPropertyDescriptor: (_target, key: string) => ({
        value: resolve(key),
        enumerable: true,
        configurable: true,
      }),
    },
  );
}
