import { getMe, logout as authLogout } from "@/services/auth";
import { getUserMe } from "@/services/users";
import { clearTokens, getRefreshToken, getValidToken } from "@/storage/tokens";
import type { MeResponse } from "@/types/auth";
import type { UserMeResponse } from "@/types/users";
import { router } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type AuthContextValue = {
  keycloakUser: MeResponse | null;
  dbUser: UserMeResponse | null;
  role: MeResponse["mainRole"];
  firstName: string | null;
  isStaff: boolean;
  isAdmin: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  keycloakUser: null,
  dbUser: null,
  role: null,
  firstName: null,
  isStaff: false,
  isAdmin: false,
  loading: true,
  isAuthenticated: false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [keycloakUser, setKeycloakUser] = useState<MeResponse | null>(null);
  const [dbUser, setDbUser] = useState<UserMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getValidToken();
        if (cancelled) return;
        if (!token) {
          // Pas de token valide → session terminée, redirection login
          router.replace("/login");
          return;
        }
        if (!cancelled) setIsAuthenticated(true);
        const [kc, db] = await Promise.all([getMe(token), getUserMe(token)]);
        if (!cancelled) {
          setKeycloakUser(kc);
          setDbUser(db);
        }
      } catch {
        // Erreur réseau temporaire : on garde l'état courant sans déconnecter
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) await authLogout(refreshToken);
    await clearTokens();
    router.replace("/login");
  }, []);

  const role = keycloakUser?.mainRole ?? null;

  return (
    <AuthContext.Provider
      value={{
        keycloakUser,
        dbUser,
        role,
        firstName: keycloakUser?.firstName ?? null,
        isStaff: role === "Admin" || role === "Agent",
        isAdmin: role === "Admin",
        loading,
        isAuthenticated,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
