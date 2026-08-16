export const DEBUG_NETWORK = process.env.EXPO_PUBLIC_DEBUG_NETWORK === "true";

/**
 * Clé de lecture OpenAgenda, commune à tous les agendas.
 *
 * Elle est **publique par conception** : OpenAgenda la destine aux applications
 * clientes, en lecture seule. Elle vit donc avec les autres `EXPO_PUBLIC_*`
 * plutôt qu'en secret EAS — et c'est un choix, pas une négligence : un secret
 * EAS est injecté au build mais **pas aux mises à jour à la volée**, qui
 * repartiraient avec une clé vide et un écran mort sans que rien ne l'explique.
 * De toute façon, tout `EXPO_PUBLIC_*` est inliné dans le bundle et s'extrait
 * d'un APK.
 *
 * Les identifiants d'agenda, eux, sont dans `constants/news-cities.ts` : une
 * liste de villes est une donnée, pas un réglage d'environnement.
 */
export const NEWS_API_KEY = process.env.EXPO_PUBLIC_OPENAGENDA_KEY ?? "";

export const DEFAULT_LOCATION = {
  latitude: 45.748,
  longitude: 4.847,
} as const;

export const MAP_DELTAS = {
  explore: 0.08,
  user: 0.05,
  incident: 0.008,
  report: 0.005,
  incidentOffset: 0.003,
} as const;

export const MAP_ANIMATION_MS = {
  trackViewChange: 600,
  markerPress: 350,
  selectDelay: 400,
  animateRegion: 800,
} as const;

// Deux pas différents, et c'est voulu. `load` est ce qu'on demande au serveur ;
// `list` ce qu'on déplie d'un coup à l'écran. Dérouler dix lignes déjà en
// mémoire est instantané, aller en chercher cinquante autres ne l'est pas — les
// confondre, c'est soit un écran qui saccade, soit une requête par clic.
export const INCIDENTS_PAGE_SIZE = {
  list: 10,
  load: 50,
} as const;

export const CLUSTER_ZOOM_THRESHOLD = 15;
export const CLUSTER_DEBOUNCE_MS = 300;

// Rafraîchissement silencieux périodique tant que l'écran concerné est au premier plan
export const POLL_INTERVAL_MS = {
  incidents: 15_000,
  votes: 15_000,
  notifications: 30_000,
} as const;
