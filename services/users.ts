import { API_ENDPOINTS } from "@/constants/api";
import { STRINGS } from "@/constants/strings";
import { authFetch, parseApiError } from "@/services/api-client";
import type { MyIncidentsResponse, UpdateMePayload, UserMeResponse } from "@/types/users";

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
    throw new Error(await parseApiError(response, STRINGS.api.updateProfileError));
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
    throw new Error(await parseApiError(response, STRINGS.api.deleteAccountError));
  }
}

