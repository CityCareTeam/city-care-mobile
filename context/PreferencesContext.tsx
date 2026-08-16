import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  type ThemePreference,
} from "@/storage/preferences";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type PreferencesValue = {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  /** Vrai tant que le disque n'a pas répondu — le temps d'un battement au démarrage. */
  loading: boolean;
};

const PreferencesContext = createContext<PreferencesValue>({
  theme: DEFAULT_PREFERENCES.theme,
  setTheme: () => {},
  loading: true,
});

/**
 * Réglages d'application, tenus en mémoire et rendus au disque.
 *
 * Le thème passe par un contexte plutôt que par une lecture directe : il est lu
 * à chaque rendu de chaque écran, et un accès au stockage à ce rythme serait
 * absurde. La valeur vit ici, l'écriture est différée au changement.
 *
 * Au démarrage on part sur `system` — donc sur le réglage de l'appareil — avant
 * même d'avoir lu le disque. C'est le pire cas : un utilisateur qui a forcé le
 * thème clair sur un téléphone en sombre verra un battement sombre. Le contraire
 * — un écran blanc sur un téléphone en sombre — se remarquerait bien davantage.
 */
export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(DEFAULT_PREFERENCES.theme);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const stored = await loadPreferences();
      setThemeState(stored.theme);
      setLoading(false);
    })();
  }, []);

  const setTheme = useCallback((next: ThemePreference) => {
    // L'écran répond tout de suite ; le disque suit. Un thème qui attendrait
    // l'écriture pour s'appliquer donnerait un bouton mou.
    setThemeState(next);
    void savePreferences({ theme: next });
  }, []);

  const value = useMemo(() => ({ theme, setTheme, loading }), [theme, setTheme, loading]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesValue {
  return useContext(PreferencesContext);
}
