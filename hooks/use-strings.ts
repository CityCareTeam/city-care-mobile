import { dictionaryFor, type Dictionary } from "@/constants/i18n";
import { usePreferences } from "@/context/PreferencesContext";

/**
 * Textes de l'interface, dans la langue active.
 *
 *     const s = useStrings();
 *     <Text>{s.settings.theme}</Text>
 *
 * On rend le dictionnaire entier plutôt qu'une fonction `t("chemin.en.chaîne")` :
 * les clés restent typées, une faute de frappe ne compile pas, et l'éditeur les
 * complète. Le prix d'une fonction à chemins est de perdre exactement ça.
 *
 * À utiliser pour tout ce qui est *affiché* : contrairement à `STRINGS`, ce
 * crochet redéclenche le rendu au changement de langue.
 */
export function useStrings(): Dictionary {
  const { language } = usePreferences();
  return dictionaryFor(language);
}
