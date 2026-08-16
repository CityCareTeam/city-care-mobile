type Reported = {
  type: string;
  status: string;
  created_at: string;
};

export type PersonalStats = {
  total: number;
  resolved: number;
  inProgress: number;
  reported: number;
  /** Part des signalements résolus, entre 0 et 1. */
  resolutionRate: number;
  /** Catégorie la plus signalée, et son compte. `null` si rien n'a été signalé. */
  topType: { type: string; count: number } | null;
  /** Date du premier signalement, en ISO. `null` s'il n'y en a aucun. */
  since: string | null;
};

/**
 * Bilan personnel, calculé sur **la liste complète** des signalements de
 * l'utilisateur.
 *
 * C'est la condition qui rend ces chiffres publiables : `/users/me/incidents`
 * n'est pas paginé, contrairement au fil de la ville. Les compteurs de l'accueil
 * portent, eux, sur les pages chargées — on ne mélange pas les deux, sous peine
 * d'annoncer un « taux de résolution » calculé sur un échantillon.
 *
 * Le délai moyen de traitement manque volontairement : la charge utile de cette
 * liste ne contient pas la date de résolution. Le déduire des incidents de la
 * ville reviendrait à le calculer sur ce qui a été chargé, donc à inventer.
 */
export function personalStats(incidents: Reported[]): PersonalStats {
  const total = incidents.length;
  const resolved = incidents.filter((i) => i.status === "resolved").length;
  const inProgress = incidents.filter((i) => i.status === "in_progress").length;
  // Déduit plutôt que filtré : un statut inconnu du client — ajouté côté
  // serveur après coup — compterait quand même, au lieu de disparaître d'un
  // décompte qui prétend faire le tour.
  const reported = total - resolved - inProgress;

  const counts = new Map<string, number>();
  for (const { type } of incidents) counts.set(type, (counts.get(type) ?? 0) + 1);

  // Ex æquo : le premier rencontré l'emporte. Départager par ordre alphabétique
  // donnerait une précision que la donnée n'a pas.
  let topType: PersonalStats["topType"] = null;
  for (const [type, count] of counts) {
    if (!topType || count > topType.count) topType = { type, count };
  }

  const since = incidents.reduce<string | null>((oldest, incident) => {
    if (!oldest) return incident.created_at;
    return Date.parse(incident.created_at) < Date.parse(oldest) ? incident.created_at : oldest;
  }, null);

  return {
    total,
    resolved,
    inProgress,
    reported,
    // Zéro signalement donne zéro pour cent, jamais `NaN` : c'est un taux qui
    // finirait affiché tel quel.
    resolutionRate: total === 0 ? 0 : resolved / total,
    topType,
    since,
  };
}
