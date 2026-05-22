import { API_ENDPOINTS } from "@/constants/api";
import type { MyIncidentsResponse, UserMeResponse } from "@/types/users";

async function authFetch(
  url: string,
  token: string,
  options: RequestInit = {},
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  return response;
}

export async function getUserMe(accessToken: string): Promise<UserMeResponse> {
  const response = await authFetch(API_ENDPOINTS.userMe, accessToken);
  if (!response.ok) throw new Error("Impossible de charger le profil.");
  return response.json() as Promise<UserMeResponse>;
}

export async function getMyIncidents(
  accessToken: string,
): Promise<MyIncidentsResponse> {
  const response = await authFetch(API_ENDPOINTS.userMyIncidents, accessToken);
  if (!response.ok) throw new Error("Impossible de charger les signalements.");
  return response.json() as Promise<MyIncidentsResponse>;
}
