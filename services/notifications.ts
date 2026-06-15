import { API_ENDPOINTS } from "@/constants/api";
import { STRINGS } from "@/constants/strings";
import { authFetch, parseApiError } from "@/services/api-client";
import type {
  NotificationSettingsResponse,
  NotificationsListResponse,
  UpdateNotificationSettingsRequest,
} from "@/types/notifications";

export async function getNotifications(
  token: string,
  params?: { page?: number; page_size?: number; unread_only?: boolean },
): Promise<NotificationsListResponse> {
  const url = new URL(API_ENDPOINTS.notifications);
  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.page_size) url.searchParams.set("page_size", String(params.page_size));
  if (params?.unread_only) url.searchParams.set("unread_only", "true");
  let response: Response;
  try {
    response = await authFetch(url.toString(), token);
  } catch {
    throw new Error(STRINGS.api.networkError);
  }
  if (!response.ok) throw new Error(STRINGS.api.genericError);
  return response.json() as Promise<NotificationsListResponse>;
}

export async function getUnreadCount(token: string): Promise<number> {
  let response: Response;
  try {
    response = await authFetch(API_ENDPOINTS.notificationsUnreadCount, token);
  } catch {
    return 0;
  }
  if (!response.ok) return 0;
  const body = await response.json() as { unread_count: number };
  return body.unread_count;
}

export async function markAsRead(token: string, id: string): Promise<void> {
  let response: Response;
  try {
    response = await authFetch(API_ENDPOINTS.notificationRead(id), token, { method: "PATCH" });
  } catch {
    throw new Error(STRINGS.api.networkError);
  }
  if (!response.ok) throw new Error(STRINGS.api.genericError);
}

export async function markAllAsRead(token: string): Promise<void> {
  let response: Response;
  try {
    response = await authFetch(API_ENDPOINTS.notificationsReadAll, token, { method: "POST" });
  } catch {
    throw new Error(STRINGS.api.networkError);
  }
  if (!response.ok) throw new Error(STRINGS.api.genericError);
}

export async function deleteNotification(token: string, id: string): Promise<void> {
  let response: Response;
  try {
    response = await authFetch(API_ENDPOINTS.notificationDelete(id), token, { method: "DELETE" });
  } catch {
    throw new Error(STRINGS.api.networkError);
  }
  if (!response.ok) throw new Error(STRINGS.api.genericError);
}

export async function deleteAllNotifications(token: string): Promise<void> {
  let response: Response;
  try {
    response = await authFetch(API_ENDPOINTS.notificationsDeleteAll, token, { method: "DELETE" });
  } catch {
    throw new Error(STRINGS.api.networkError);
  }
  if (!response.ok) throw new Error(STRINGS.api.genericError);
}

export async function registerPushToken(token: string, pushToken: string): Promise<void> {
  try {
    const res = await authFetch(API_ENDPOINTS.pushToken, token, {
      method: "PATCH",
      body: JSON.stringify({ push_token: pushToken }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn("[push] PATCH /push-token failed", res.status, body);
    }
  } catch (e) {
    console.warn("[push] PATCH /push-token error", e);
  }
}

export async function getNotificationSettings(
  token: string,
): Promise<NotificationSettingsResponse> {
  let response: Response;
  try {
    response = await authFetch(API_ENDPOINTS.notificationSettings, token);
  } catch {
    throw new Error(STRINGS.api.networkError);
  }
  if (!response.ok) throw new Error(STRINGS.api.notifSettingsLoadError);
  return response.json() as Promise<NotificationSettingsResponse>;
}

export async function updateNotificationSettings(
  token: string,
  payload: UpdateNotificationSettingsRequest,
): Promise<void> {
  let response: Response;
  try {
    response = await authFetch(API_ENDPOINTS.notificationSettings, token, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(STRINGS.api.networkError);
  }
  if (!response.ok) {
    throw new Error(await parseApiError(response, STRINGS.api.notifSettingsUpdateError));
  }
}
