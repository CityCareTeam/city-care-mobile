import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";

/**
 * Retours d'interface : vibration et son, ensemble.
 *
 * Ils étaient deux choses séparées, et c'était un tort — ils répondent aux mêmes
 * gestes, doivent se déclencher au même instant et se règlent d'un même
 * mouvement. Un seul point d'entrée, donc, et deux interrupteurs.
 *
 * Le son est **désactivé par défaut** : une application qui se met à sonner sans
 * qu'on l'ait demandé se fait couper le volume, pas régler.
 *
 * ⚠️ Ce module ouvre `expo-audio`, un module natif. Le JavaScript qui l'importe
 * ne peut donc pas être livré à un binaire construit avant lui — d'où
 * l'incrémentation de `constants/native-runtime.json`, qui empêche la mise à
 * jour à la volée d'atteindre les anciennes installations.
 */

/**
 * Trois sons, trois intentions — la même grammaire que les vibrations.
 *
 * Ils sont chargés paresseusement et gardés : construire un lecteur coûte, et
 * l'application rejouera les mêmes trois sons des centaines de fois. Ceux d'un
 * utilisateur qui laisse le son éteint ne sont jamais construits du tout.
 */
const FILES = {
  success: require("@/assets/sounds/success.wav"),
  tap: require("@/assets/sounds/tap.wav"),
  warn: require("@/assets/sounds/warn.wav"),
} as const;

export type Cue = keyof typeof FILES;

const players = new Map<Cue, AudioPlayer>();

/**
 * Réglages courants, poussés depuis le contexte.
 *
 * Ces fonctions sont appelées depuis des gestionnaires d'événements et des
 * services, pas seulement depuis des composants : elles ne peuvent pas lire un
 * hook. Le contexte leur dépose donc l'état, comme il le fait déjà pour la
 * langue active.
 */
let enabled = { haptics: true, sounds: false };

export function setFeedbackPreferences(next: { haptics: boolean; sounds: boolean }): void {
  enabled = next;
  // Le son vient d'être coupé : on relâche les lecteurs plutôt que de garder en
  // mémoire ce qu'on ne jouera plus.
  if (!next.sounds) {
    for (const player of players.values()) player.remove();
    players.clear();
  }
}

function play(cue: Cue): void {
  if (!enabled.sounds) return;
  try {
    let player = players.get(cue);
    if (!player) {
      player = createAudioPlayer(FILES[cue]);
      players.set(cue, player);
    }
    // Rembobiné avant chaque lecture : un lecteur arrivé au bout reste au bout,
    // et `play()` seul ne rejouerait rien.
    void player.seekTo(0);
    player.play();
  } catch {
    // Un son raté n'est pas un incident : le geste a abouti, c'est l'essentiel.
  }
}

function vibrate(run: () => Promise<void>): void {
  if (!enabled.haptics) return;
  void run().catch(() => {});
}

/**
 * Fait entendre un son sans consulter la préférence.
 *
 * Réservé à l'interrupteur qui vient de l'activer : un réglage sonore muet est
 * une promesse sur parole, et l'entendre au moment du choix dit d'un coup qu'il
 * marche, que le volume est monté, et à quoi il ressemble. Il ne consulte pas la
 * préférence parce qu'elle n'est pas encore appliquée à cet instant — l'état de
 * React est mis à jour au rendu suivant.
 */
export function previewSound(): void {
  const player = createAudioPlayer(FILES.success);
  try {
    player.play();
  } catch {
    // Sans son, l'interrupteur reste utilisable : il n'a rien promis d'autre.
  }
}

/** Un choix pris en compte : vote, sélection qui change quelque chose. */
export function tapped(): void {
  vibrate(() => Haptics.selectionAsync());
  play("tap");
}

/** Une action menée à bien : signalement envoyé, mot de passe changé. */
export function succeeded(): void {
  vibrate(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  play("success");
}

/** Une action irréversible : suppression. Plus sec que le succès, à dessein. */
export function warned(): void {
  vibrate(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  play("warn");
}
