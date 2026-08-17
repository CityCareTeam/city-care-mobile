import { usePreferences } from "@/context/PreferencesContext";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef } from "react";

/** Cadence de reprise tant qu'un chargement est en échec. */
export const RETRY_INTERVAL_MS = 3_000;

/**
 * Facteur appliqué en mode économie.
 *
 * Quatre, pas dix : au-delà, un signalement mettrait deux minutes à apparaître
 * et l'écran passerait pour figé. Économiser ne doit pas se payer en doute.
 */
export const BATTERY_SAVER_FACTOR = 4;

type Options = {
  /** Cadence normale, quand tout va bien. */
  interval: number;
  /** Un chargement a échoué : on repasse en cadence de reprise. */
  failed?: boolean;
  /** Suspend complètement le rafraîchissement (écran non authentifié, etc.). */
  enabled?: boolean;
};

/**
 * Rafraîchissement automatique de l'écran au premier plan.
 *
 * Deux cadences plutôt qu'une : au régime normal on sonde tranquillement, mais
 * dès qu'un chargement échoue on resserre à quelques secondes. Le retour du
 * réseau est donc rattrapé presque tout de suite, au lieu d'attendre le
 * prochain cycle — sans avoir à écouter l'état de la connexion, donc sans
 * module natif supplémentaire.
 *
 * Seul l'écran affiché sonde : `useFocusEffect` arrête tout en arrière-plan.
 */
export function useAutoRefresh(
  refresh: (silent: boolean) => void,
  { interval, failed = false, enabled = true }: Options,
) {
  // Gardé dans une ref pour que changer de cadence ne relance pas un
  // chargement complet — seul le minuteur est reconstruit.
  const refreshRef = useRef(refresh);
  useEffect(() => { refreshRef.current = refresh; }, [refresh]);

  /**
   * L'économie espace le régime normal et laisse la reprise intacte.
   *
   * Ralentir aussi la reprise reviendrait à punir une coupure réseau : c'est le
   * moment où l'on veut au contraire retrouver la main vite, et trois secondes
   * d'un minuteur qui tourne le temps d'un tunnel ne coûtent rien.
   */
  const { batterySaver } = usePreferences();
  const delay = failed ? RETRY_INTERVAL_MS : interval * (batterySaver ? BATTERY_SAVER_FACTOR : 1);

  // Chargement visible : à l'arrivée sur l'écran, et seulement là.
  useFocusEffect(
    useCallback(() => {
      if (enabled) refreshRef.current(false);
    }, [enabled]),
  );

  // Minuteur séparé, pour qu'un changement de cadence reconstruise le minuteur
  // sans relancer un chargement visible — sinon tomber en échec ferait
  // clignoter le voile de chargement.
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      const timer = setInterval(() => refreshRef.current(true), delay);
      return () => clearInterval(timer);
    }, [enabled, delay]),
  );
}
