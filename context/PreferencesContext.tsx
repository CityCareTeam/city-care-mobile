import { setActiveLanguage, type LanguagePreference } from "@/constants/i18n";
import { setFeedbackPreferences } from "@/utils/feedback";
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  type Preferences,
  type SortPreference,
  type ThemePreference,
} from "@/storage/preferences";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type PreferencesValue = {
  theme: ThemePreference;
  language: LanguagePreference;
  haptics: boolean;
  sounds: boolean;
  defaultSort: SortPreference;
  nearbyAlerts: boolean;
  nearbyRadiusKm: number;
  setTheme: (theme: ThemePreference) => void;
  setLanguage: (language: LanguagePreference) => void;
  setHaptics: (on: boolean) => void;
  setSounds: (on: boolean) => void;
  setDefaultSort: (sort: SortPreference) => void;
  setNearbyAlerts: (on: boolean) => void;
  setNearbyRadiusKm: (km: number) => void;
  /** Vrai tant que le disque n'a pas répondu — le temps d'un battement au démarrage. */
  loading: boolean;
};

const PreferencesContext = createContext<PreferencesValue>({
  ...DEFAULT_PREFERENCES,
  setTheme: () => {},
  setLanguage: () => {},
  setHaptics: () => {},
  setSounds: () => {},
  setDefaultSort: () => {},
  setNearbyAlerts: () => {},
  setNearbyRadiusKm: () => {},
  loading: true,
});

/**
 * Réglages d'application, tenus en mémoire et rendus au disque.
 *
 * Ils passent par un contexte plutôt que par une lecture directe : le thème est
 * lu à chaque rendu de chaque écran, et un accès au stockage à ce rythme serait
 * absurde. Les valeurs vivent ici, l'écriture est différée au changement.
 *
 * Au démarrage on part sur `system` — donc sur les réglages de l'appareil —
 * avant même d'avoir lu le disque. C'est le pire cas : un utilisateur qui a forcé
 * le thème clair sur un téléphone en sombre verra un battement sombre. Le
 * contraire — un écran blanc sur un téléphone en sombre — se remarquerait bien
 * davantage.
 */
export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const stored = await loadPreferences();
      setPreferences(stored);
      setActiveLanguage(stored.language);
      setFeedbackPreferences(stored);
      setLoading(false);
    })();
  }, []);

  const update = useCallback((patch: Partial<Preferences>) => {
    // L'écran répond tout de suite ; le disque suit. Un réglage qui attendrait
    // l'écriture pour s'appliquer donnerait un bouton mou.
    setPreferences((previous) => {
      const next = { ...previous, ...patch };
      // Les textes lus hors composant — alertes, services — passent par la
      // langue active plutôt que par le contexte : elle se met à jour ici.
      if (patch.language) setActiveLanguage(next.language);
      // Vibrations et sons se déclenchent depuis des gestionnaires et des
      // services, hors de tout composant : ils reçoivent l'état plutôt que de
      // lire le contexte.
      if (patch.haptics !== undefined || patch.sounds !== undefined) setFeedbackPreferences(next);
      void savePreferences(next);
      return next;
    });
  }, []);

  const setTheme = useCallback((theme: ThemePreference) => update({ theme }), [update]);
  const setLanguage = useCallback(
    (language: LanguagePreference) => update({ language }),
    [update],
  );

  const setHaptics = useCallback((haptics: boolean) => update({ haptics }), [update]);
  const setSounds = useCallback((sounds: boolean) => update({ sounds }), [update]);
  const setDefaultSort = useCallback(
    (defaultSort: SortPreference) => update({ defaultSort }),
    [update],
  );

  const setNearbyAlerts = useCallback((nearbyAlerts: boolean) => update({ nearbyAlerts }), [update]);
  const setNearbyRadiusKm = useCallback(
    (nearbyRadiusKm: number) => update({ nearbyRadiusKm }),
    [update],
  );

  const value = useMemo(
    () => ({ ...preferences, setTheme, setLanguage, setHaptics, setSounds, setDefaultSort, setNearbyAlerts, setNearbyRadiusKm, loading }),
    [preferences, setTheme, setLanguage, setHaptics, setSounds, setDefaultSort, setNearbyAlerts, setNearbyRadiusKm, loading],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesValue {
  return useContext(PreferencesContext);
}
