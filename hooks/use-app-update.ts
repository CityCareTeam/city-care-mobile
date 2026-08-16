import * as Updates from "expo-updates";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

/**
 * Mises à jour à la volée (OTA).
 *
 * `expo-updates` télécharge le nouveau bundle en fond et l'applique au
 * lancement suivant, sans rien demander. C'est le bon défaut : personne ne veut
 * qu'une application se recharge sous ses doigts.
 *
 * Reste le cas du testeur à qui on vient d'annoncer un correctif et qui ne va
 * pas tuer l'application pour le voir. D'où une bannière — proposée, jamais
 * imposée, et refusable.
 *
 * En développement `expo-updates` est inactif : `useUpdates()` renvoie alors un
 * état vide, la bannière ne s'affiche jamais et rien de tout ceci ne gêne.
 */
export function useAppUpdate() {
  const { isUpdatePending } = Updates.useUpdates();
  const [dismissed, setDismissed] = useState(false);
  const [applying, setApplying] = useState(false);

  const apply = useCallback(async () => {
    setApplying(true);
    try {
      await Updates.reloadAsync();
    } catch {
      // Le rechargement a échoué — on rend la main plutôt que de laisser un
      // bouton inerte : la mise à jour s'appliquera de toute façon au prochain
      // démarrage, réessayer ici ne coûte rien.
      setApplying(false);
    }
  }, []);

  const dismiss = useCallback(() => setDismissed(true), []);

  useForegroundUpdateCheck();

  return { ready: isUpdatePending && !dismissed, applying, apply, dismiss };
}

/**
 * Nouvelle recherche au retour au premier plan.
 *
 * `expo-updates` ne cherche qu'au démarrage. Qui laisse l'application ouverte en
 * arrière-plan pendant des jours — c'est-à-dire à peu près tout le monde sur
 * Android — ne voit donc jamais rien arriver. On avait le cas dès le premier
 * essai : la mise à jour n'apparaissait qu'après avoir tué l'application et
 * l'avoir rouverte.
 *
 * Une recherche est silencieuse et coûte une requête ; on l'espace tout de même,
 * sinon chaque aller-retour vers une autre application en déclencherait une.
 */
const FOREGROUND_CHECK_INTERVAL_MS = 5 * 60 * 1000;

function useForegroundUpdateCheck() {
  const lastCheck = useRef(0);

  // Une recherche au montage, sans attendre un passage en arrière-plan.
  //
  // `expo-updates` en fait une au lancement, mais elle vit du côté natif et son
  // résultat n'atteignait pas toujours l'écran : en pratique, la bannière
  // n'apparaissait qu'après une recherche manuelle. Une requête de plus au
  // démarrage coûte moins cher qu'une mise à jour que personne ne voit.
  useEffect(() => {
    lastCheck.current = Date.now();
    void checkAndFetchUpdate();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      if (Date.now() - lastCheck.current < FOREGROUND_CHECK_INTERVAL_MS) return;
      lastCheck.current = Date.now();
      void checkAndFetchUpdate();
    });
    return () => subscription.remove();
  }, []);
}

/**
 * Cherche, et télécharge s'il y a lieu. Renvoie ce qui s'est passé, pour que
 * l'écran des mises à jour puisse le dire — un bouton qui ne répond rien laisse
 * croire qu'il n'a rien fait.
 */
export type UpdateCheckResult = "downloaded" | "up-to-date" | "unavailable" | "failed";

export async function checkAndFetchUpdate(): Promise<UpdateCheckResult> {
  // Désactivé en développement, et sur un binaire qui n'a pas été construit avec
  // les mises à jour : demander quand même remonterait une erreur trompeuse.
  if (!Updates.isEnabled) return "unavailable";

  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return "up-to-date";
    await Updates.fetchUpdateAsync();
    return "downloaded";
  } catch {
    return "failed";
  }
}

/**
 * Repère du bundle en cours d'exécution, tronqué à ses huit premiers caractères
 * — un identifiant d'update est un UUID, et son préfixe suffit à distinguer deux
 * publications.
 *
 * Vide tant qu'on tourne sur le bundle embarqué dans l'APK : le rang de build
 * dit alors déjà tout, et afficher un identifiant sur chaque build neuf n'aurait
 * été que du bruit. Il n'apparaît que lorsque du JS a effectivement remplacé
 * celui livré avec le binaire — c'est précisément ce qu'on cherche à savoir en
 * regardant un appareil de test.
 */
export function useRunningUpdate(): string {
  const { currentlyRunning } = Updates.useUpdates();
  if (currentlyRunning.isEmbeddedLaunch) return "";
  return currentlyRunning.updateId?.slice(0, 8) ?? "";
}
