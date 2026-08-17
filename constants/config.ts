export const DEBUG_NETWORK = process.env.EXPO_PUBLIC_DEBUG_NETWORK === "true";

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
