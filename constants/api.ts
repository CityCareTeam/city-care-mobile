export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5158";

export const API_ENDPOINTS = {
  login: `${API_BASE_URL}/auth/login`,
  register: `${API_BASE_URL}/auth/register`,
  refresh: `${API_BASE_URL}/auth/refresh`,
  me: `${API_BASE_URL}/auth/me`,
  logout: `${API_BASE_URL}/auth/logout`,
  // Users
  userMe: `${API_BASE_URL}/users/me`,
  userMyIncidents: `${API_BASE_URL}/users/me/incidents`,
  // Incidents
  incidents: `${API_BASE_URL}/incidents`,
  incidentPhotos: (id: string) => `${API_BASE_URL}/incidents/${id}/photos`,
  incidentPhoto: (incidentId: string, photoId: string) => `${API_BASE_URL}/incidents/${incidentId}/photos/${photoId}`,
  incidentStatusHistory: (id: string) => `${API_BASE_URL}/incidents/${id}/status-history`,
  geocodeReverse: `${API_BASE_URL}/geocode/reverse`,
};
