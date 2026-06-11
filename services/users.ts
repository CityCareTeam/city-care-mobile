import { API_ENDPOINTS } from "@/constants/api";
import { STRINGS } from "@/constants/strings";
import { fetchWithTimeout } from "@/services/api-client";
import type { MyIncidentsResponse, UpdateMePayload, UserMeResponse } from "@/types/users";

async function authFetch(
  url: string,
  token: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetchWithTimeout(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

async function parseError(response: Response, fallback: string): Promise<string> {
  const text = await response.text().catch(() => "");
  try {
    const data = JSON.parse(text) as Record<string, unknown>;
    return ((data?.error ?? data?.message ?? data?.title ?? text) as string) || fallback;
  } catch {
    return text || fallback;
  }
}

export async function getUserMe(accessToken: string): Promise<UserMeResponse> {
  let response: Response;
  try {
    response = await authFetch(API_ENDPOINTS.userMe, accessToken);
  } catch {
    throw new Error(STRINGS.api.networkError);
  }
  if (!response.ok) throw new Error(STRINGS.api.profileLoadError);
  return response.json() as Promise<UserMeResponse>;
}

export async function getMyIncidents(
  accessToken: string,
): Promise<MyIncidentsResponse> {
  let response: Response;
  try {
    response = await authFetch(API_ENDPOINTS.userMyIncidents, accessToken);
  } catch {
    throw new Error(STRINGS.api.networkError);
  }
  if (!response.ok) throw new Error(STRINGS.api.incidentsLoadError);
  return response.json() as Promise<MyIncidentsResponse>;
}

export async function updateMe(
  accessToken: string,
  payload: UpdateMePayload,
): Promise<void> {
  let response: Response;
  try {
    response = await authFetch(API_ENDPOINTS.userMe, accessToken, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(STRINGS.api.networkError);
  }
  if (!response.ok) {
    throw new Error(await parseError(response, STRINGS.api.updateProfileError));
  }
}

export async function deleteAccount(accessToken: string): Promise<void> {
  let response: Response;
  try {
    response = await authFetch(API_ENDPOINTS.userMe, accessToken, { method: "DELETE" });
  } catch {
    throw new Error(STRINGS.api.networkError);
  }
  if (!response.ok) {
    throw new Error(await parseError(response, STRINGS.api.deleteAccountError));
  }
}

