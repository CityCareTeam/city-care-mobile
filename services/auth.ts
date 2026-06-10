import { API_ENDPOINTS } from "@/constants/api";
import { STRINGS } from "@/constants/strings";
import { fetchWithTimeout, throwFromResponse } from "@/services/api-client";
import type {
    LoginPayload,
    LoginResponse,
    MeResponse,
    RegisterPayload,
    RegisterResponse,
} from "@/types/auth";

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  let response: Response;
  try {
    response = await fetchWithTimeout(API_ENDPOINTS.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : STRINGS.api.networkError);
  }

  if (!response.ok)
    await throwFromResponse(response, STRINGS.api.invalidCredentials);
  return response.json() as Promise<LoginResponse>;
}

export async function register(
  payload: RegisterPayload,
): Promise<RegisterResponse> {
  let response: Response;
  try {
    response = await fetchWithTimeout(API_ENDPOINTS.register, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(STRINGS.api.networkError);
  }

  if (!response.ok)
    await throwFromResponse(response, STRINGS.api.registerError);
  return response.json() as Promise<RegisterResponse>;
}

export async function refreshToken(token: string): Promise<LoginResponse> {
  let response: Response;
  try {
    response = await fetchWithTimeout(API_ENDPOINTS.refresh, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: token }),
    });
  } catch {
    throw new Error(STRINGS.api.networkError);
  }

  if (!response.ok) await throwFromResponse(response, STRINGS.api.sessionExpired);
  return response.json() as Promise<LoginResponse>;
}

export async function getMe(accessToken: string): Promise<MeResponse> {
  let response: Response;
  try {
    response = await fetchWithTimeout(API_ENDPOINTS.me, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new Error(STRINGS.api.networkError);
  }

  if (!response.ok) throw new Error(STRINGS.api.unauthorized);
  return response.json() as Promise<MeResponse>;
}

export async function logout(token: string): Promise<void> {
  try {
    await fetchWithTimeout(API_ENDPOINTS.logout, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: token }),
    });
  } catch {
    // Échec silencieux : on déconnecte côté client de toute façon
  }
}
