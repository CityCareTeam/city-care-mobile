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
  notificationSettings: `${API_BASE_URL}/users/me/notification-settings`,
  pushToken: `${API_BASE_URL}/users/me/push-token`,
  notifications: `${API_BASE_URL}/users/me/notifications`,
  notificationsUnreadCount: `${API_BASE_URL}/users/me/notifications/unread-count`,
  notificationRead: (id: string) => `${API_BASE_URL}/users/me/notifications/${id}/read`,
  notificationsReadAll: `${API_BASE_URL}/users/me/notifications/read-all`,
  // Incidents
  incidents: `${API_BASE_URL}/incidents`,
  incidentPhotos: (id: string) => `${API_BASE_URL}/incidents/${id}/photos`,
  incidentPhoto: (incidentId: string, photoId: string) => `${API_BASE_URL}/incidents/${incidentId}/photos/${photoId}`,
  incidentStatusHistory: (id: string) => `${API_BASE_URL}/incidents/${id}/status-history`,
  mapSummary: `${API_BASE_URL}/incidents/map-summary`,
  incidentMessages: (id: string) => `${API_BASE_URL}/incidents/${id}/messages`,
  incidentChatHub: `${API_BASE_URL}/hubs/incident-chat`,
  geocodeReverse: `${API_BASE_URL}/geocode/reverse`,
};
