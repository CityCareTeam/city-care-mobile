import * as Updates from "expo-updates";
import { useCallback, useState } from "react";

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

  return { ready: isUpdatePending && !dismissed, applying, apply, dismiss };
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
