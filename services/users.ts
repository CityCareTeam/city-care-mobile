import { API_ENDPOINTS } from "@/constants/api";
import { STRINGS } from "@/constants/strings";
import { fetchWithTimeout } from "@/services/api-client";
import type { MyIncidentsResponse, UserMeResponse } from "@/types/users";

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

