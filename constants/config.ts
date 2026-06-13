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
  incidentOffset: 0.002,
} as const;

export const MAP_ANIMATION_MS = {
  trackViewChange: 600,
  markerPress: 350,
  selectDelay: 400,
  animateRegion: 800,
} as const;

export const INCIDENTS_PAGE_SIZE = {
  list: 10,
  load: 50,
} as const;

export const CLUSTER_ZOOM_THRESHOLD = 15;
export const CLUSTER_DEBOUNCE_MS = 300;
