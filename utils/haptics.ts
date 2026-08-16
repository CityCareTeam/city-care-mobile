import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * Retour haptique des gestes qui comptent.
 *
 * Le projet ne s'en servait que dans la barre d'onglets, et **seulement sur
 * iOS** — un `Platform.OS === "ios"` hérité de l'époque où le moteur haptique
 * Android était inégal. Il ne l'est plus depuis longtemps, et l'application
 * n'est distribuée que sur Android : la condition revenait à désactiver la
 * fonctionnalité là où elle sert.
 *
 * Trois intensités, pas davantage. Un retour qui accompagne tout n'accompagne
 * plus rien : on le réserve aux gestes dont l'issue compte — un envoi, un vote,
 * une suppression — et jamais à la navigation ordinaire.
 */

/** Un choix pris en compte : vote, sélection qui change quelque chose. */
export function tapped(): void {
  void Haptics.selectionAsync().catch(() => {});
}

/** Une action menée à bien : signalement envoyé, mot de passe changé. */
export function succeeded(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** Une action irréversible : suppression. Plus sec que le succès, à dessein. */
export function warned(): void {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/**
 * Le web n'a pas de moteur haptique et les appels y échouent bruyamment. Les
 * fonctions ci-dessus avalent déjà l'erreur ; celle-ci sert aux appelants qui
 * veulent l'éviter tout court.
 */
export const HAPTICS_AVAILABLE = Platform.OS !== "web";
