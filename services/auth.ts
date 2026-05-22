import { API_ENDPOINTS } from "@/constants/api";
import type {
    LoginPayload,
    LoginResponse,
    MeResponse,
    RegisterPayload,
    RegisterResponse,
} from "@/types/auth";

// ── Helpers ──────────────────────────────────────────────────────────────

const TIMEOUT_MS = 8000;

function fetchWithTimeout(
  url: string,
  options: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id),
  );
}

async function throwFromResponse(
  response: Response,
  fallback: string,
): Promise<never> {
  const text = await response.text().catch(() => "");
  try {
    const json = JSON.parse(text);
    // Format validation ASP.NET Core : { errors: { Field: ["msg"] }, title: "..." }
    if (json.errors && typeof json.errors === "object") {
      const first = Object.values(json.errors as Record<string, string[]>)[0];
      if (Array.isArray(first) && first.length > 0) throw new Error(first[0]);
    }
    // Format OAuth Keycloak : { error: "invalid_grant", error_description: "..." }
    if (json.error_description) throw new Error(json.error_description);
    throw new Error(json.message ?? json.error ?? json.title ?? fallback);
  } catch (e) {
    if (e instanceof Error && e.message !== fallback) throw e;
    throw new Error(text || fallback);
  }
}

// ── Fonctions ────────────────────────────────────────────────────────────

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  let response: Response;
  try {
    response = await fetchWithTimeout(API_ENDPOINTS.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Serveur inaccessible. Vérifiez votre connexion.");
  }

  if (!response.ok)
    await throwFromResponse(response, "Identifiants incorrects.");
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
    throw new Error("Serveur inaccessible. Vérifiez votre connexion.");
  }

  if (!response.ok)
    await throwFromResponse(response, "Erreur lors de la création du compte.");
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
    throw new Error("Serveur inaccessible. Vérifiez votre connexion.");
  }

  if (!response.ok) await throwFromResponse(response, "Session expirée.");
  return response.json() as Promise<LoginResponse>;
}

export async function getMe(accessToken: string): Promise<MeResponse> {
  let response: Response;
  try {
    response = await fetchWithTimeout(API_ENDPOINTS.me, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new Error("Serveur inaccessible. Vérifiez votre connexion.");
  }

  if (!response.ok) throw new Error("Non autorisé.");
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
