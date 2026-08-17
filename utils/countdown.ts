import type { Dictionary } from "@/constants/i18n";

/**
 * Combien de temps avant un événement, dit comme on le dirait.
 *
 * Une liste d'actualités affiche « Samedi 19 septembre », et il faut compter sur
 * ses doigts pour savoir si c'est ce week-end ou dans deux mois. Cette ligne
 * répond à la seule question qu'on se pose vraiment devant un agenda : est-ce
 * bientôt ?
 *
 * Au-delà d'un mois, elle se taît. « Dans 47 jours » n'aide personne à décider
 * quoi que ce soit, et la date, elle, est déjà là.
 */
const HORIZON_DAYS = 31;

export function countdown(
  startsAt: string | null | undefined,
  t: Dictionary,
  now: Date = new Date(),
): string {
  if (!startsAt) return "";

  const start = new Date(startsAt).getTime();
  if (!Number.isFinite(start)) return "";

  const minutes = Math.round((start - now.getTime()) / 60_000);
  // En cours ou passé de peu : l'événement du jour reste affiché toute la
  // journée par la source, et « il y a 3 h » n'est pas ce qu'on veut lire.
  if (minutes < 0) return t.countdown.now;

  /**
   * Le calendrier avant l'horloge, et dans cet ordre précisément.
   *
   * On compte en jours de calendrier, pas en tranches de vingt-quatre heures :
   * un événement demain à 9 h est « demain », même s'il n'est que dans dix-huit
   * heures — c'est ainsi qu'on en parle. Tester les heures d'abord aurait rendu
   * « dans 18 h », qui est vrai et illisible.
   */
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const startDay = new Date(start);
  startDay.setHours(0, 0, 0, 0);
  const days = Math.round((startDay.getTime() - midnight.getTime()) / 86_400_000);

  if (days >= 1) {
    if (days === 1) return t.countdown.tomorrow;
    return days <= HORIZON_DAYS ? t.countdown.days(days) : "";
  }

  // Aujourd'hui : là, l'horloge reprend la main.
  if (minutes < 60) return t.countdown.soon;
  return t.countdown.hours(Math.floor(minutes / 60));
}
