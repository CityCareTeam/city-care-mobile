import { getStrings, type Dictionary } from "@/constants/i18n";

/**
 * Lecture d'un horodatage venu du serveur.
 *
 * `new Date("2026-08-16T20:00:00")` — sans fuseau — est interprété par
 * JavaScript comme une **heure locale**. Le même instant se décale alors du
 * décalage de l'appareil : un téléphone réglé sur un fuseau américain affiche
 * « il y a 6 h » pour une notification reçue à l'instant.
 *
 * Le back attache aujourd'hui un `+02:00` à toutes ses dates, donc le cas ne se
 * produit pas — mais rien dans le contrat ne le garantit, et le jour où un
 * champ partira sans fuseau, le défaut sera invisible depuis la France et
 * inexplicable ailleurs. On complète donc : une date sans fuseau est de l'UTC,
 * ce que le serveur écrit réellement.
 */
export function parseServerDate(dateStr: string): Date {
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(dateStr.trim());
  return new Date(hasTimezone ? dateStr : `${dateStr}Z`);
}

/**
 * Toutes les dates se formatent dans la langue active.
 *
 * Elles étaient figées en `"fr-FR"` à sept endroits : une interface passée en
 * anglais continuait d'annoncer « Dimanche 16 août 2026 ». La locale vit
 * désormais dans le dictionnaire, à côté des textes qu'elle accompagne.
 *
 * Lue à l'appel et non capturée : ces fonctions ne sont pas des crochets, elles
 * doivent suivre la langue sans qu'on les rappelle.
 */
function locale(): string {
  return getStrings().locale;
}

export function formatIncidentDateTime(dateStr: string): string {
  return parseServerDate(dateStr).toLocaleDateString(locale(), {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(dateStr: string): string {
  return parseServerDate(dateStr).toLocaleDateString(locale(), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  return parseServerDate(dateStr).toLocaleDateString(locale(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Durée écoulée, en toutes lettres.
 *
 * Le dictionnaire est **exigé en paramètre**, alors que les autres fonctions de
 * ce fichier lisent la langue active : celle-ci est affichée sur chaque ligne de
 * notification et d'incident, et `NotificationRow` est mémoïsée sans consommer
 * aucun contexte. Sans une valeur qui change dans ses props, elle ne se
 * redessinerait pas au changement de langue et garderait ses « Il y a 3 h »
 * français. Le paramètre force l'appelant à tenir le dictionnaire, donc à se
 * redessiner avec lui.
 */
export function timeAgo(dateStr: string, strings: Dictionary = getStrings()): string {
  const diff = Date.now() - parseServerDate(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return strings.relative.now;
  if (mins < 60) return strings.relative.minutes(mins);
  const hours = Math.floor(mins / 60);
  if (hours < 24) return strings.relative.hours(hours);
  const days = Math.floor(hours / 24);
  if (days === 1) return strings.relative.yesterday;
  if (days < 7) return strings.relative.days(days);
  return parseServerDate(dateStr).toLocaleDateString(strings.locale, {
    day: "numeric",
    month: "short",
  });
}

/**
 * Jour auquel appartient une date, du point de vue du lecteur.
 *
 * Comparé sur le *jour civil* et non sur un écart d'heures : une notification
 * reçue à 23 h 50 est d'hier à 0 h 10, même si dix minutes seulement se sont
 * écoulées. C'est ainsi qu'on la cherche dans une liste.
 */
export type DayBucket = "today" | "yesterday" | "earlier";

export function dayBucket(dateStr: string, now: Date = new Date()): DayBucket {
  const date = parseServerDate(dateStr);
  if (Number.isNaN(date.getTime())) return "earlier";

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const time = date.getTime();

  if (time >= startOfToday) return "today";
  if (time >= startOfToday - 24 * 60 * 60 * 1000) return "yesterday";
  return "earlier";
}
