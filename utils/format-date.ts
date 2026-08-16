export function formatIncidentDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
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
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "earlier";

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const time = date.getTime();

  if (time >= startOfToday) return "today";
  if (time >= startOfToday - 24 * 60 * 60 * 1000) return "yesterday";
  return "earlier";
}
