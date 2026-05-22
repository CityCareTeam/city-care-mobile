import { refreshToken as apiRefreshToken } from "@/services/auth";
import * as SecureStore from "expo-secure-store";

const KEYS = {
  accessToken: "auth_access_token",
  refreshToken: "auth_refresh_token",
} as const;

export async function saveTokens(access: string, refresh: string) {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.accessToken, access),
    SecureStore.setItemAsync(KEYS.refreshToken, refresh),
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.accessToken);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.refreshToken);
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.accessToken),
    SecureStore.deleteItemAsync(KEYS.refreshToken),
  ]);
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // exp est en secondes, on ajoute 30s de marge
    return payload.exp * 1000 < Date.now() + 30_000;
  } catch {
    return true;
  }
}

/**
 * Retourne un access token valide.
 * Si le token courant est expiré, tente un refresh automatique.
 * Retourne null si le refresh échoue (session terminée).
 */
export async function getValidToken(): Promise<string | null> {
  const access = await SecureStore.getItemAsync(KEYS.accessToken);
  if (access && !isTokenExpired(access)) return access;

  const refresh = await SecureStore.getItemAsync(KEYS.refreshToken);
  if (!refresh) return null;

  try {
    const res = await apiRefreshToken(refresh);
    await Promise.all([
      SecureStore.setItemAsync(KEYS.accessToken, res.accessToken),
      SecureStore.setItemAsync(KEYS.refreshToken, res.refreshToken),
    ]);
    return res.accessToken;
  } catch {
    return null;
  }
}
