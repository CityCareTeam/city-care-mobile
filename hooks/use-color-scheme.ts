import { usePreferences } from "@/context/PreferencesContext";
import { useColorScheme as useSystemColorScheme } from "react-native";

/**
 * Thème effectif de l'application.
 *
 * Ce crochet réexportait celui de React Native : l'application suivait le
 * système, sans recours. Elle suit désormais la préférence de l'utilisateur, et
 * ne retombe sur le système que si personne n'a choisi — ce qui reste le défaut.
 *
 * Tout le thème passe par ici : `useAppColors` et les deux mises en page racine
 * sont les seuls appelants, et les écrans n'ont rien à savoir de la préférence.
 * C'est ce qui permet d'ajouter le réglage sans toucher un seul écran.
 */
export function useColorScheme(): "light" | "dark" {
  const system = useSystemColorScheme();
  const { theme } = usePreferences();

  if (theme === "light" || theme === "dark") return theme;
  return system === "dark" ? "dark" : "light";
}
