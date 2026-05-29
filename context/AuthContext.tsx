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
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [keycloakUser, setKeycloakUser] = useState<MeResponse | null>(null);
  const [dbUser, setDbUser] = useState<UserMeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getValidToken();
        if (!token || cancelled) return;
        const [kc, db] = await Promise.all([getMe(token), getUserMe(token)]);
        if (!cancelled) {
          setKeycloakUser(kc);
          setDbUser(db);
        }
      } catch {
        // silencieux
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
