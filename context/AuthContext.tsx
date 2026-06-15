import { getMe, logout as authLogout } from "@/services/auth";
import { registerPushToken } from "@/services/notifications";
import { getUserMe } from "@/services/users";
import { clearTokens, getAccessToken, getRefreshToken, getValidToken } from "@/storage/tokens";
import type { MeResponse } from "@/types/auth";
import type { UserMeResponse } from "@/types/users";
import { Toast } from "@/components/ui/ToastMessage";
import { STRINGS } from "@/constants/strings";
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
  authError: string | null;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
  authError: null,
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [keycloakUser, setKeycloakUser] = useState<MeResponse | null>(null);
  const [dbUser, setDbUser] = useState<UserMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const hadToken = !!(await getAccessToken());
        const token = await getValidToken();
        if (cancelled) return;
        if (!token) {
          if (hadToken) {
            Toast.show({
              type: "error",
              text1: STRINGS.alert.sessionExpiredTitle,
              text2: STRINGS.alert.sessionExpiredMsg,
            });
          }
          router.replace("/login");
          return;
        }
        if (!cancelled) setIsAuthenticated(true);
        const [kc, db] = await Promise.all([getMe(token), getUserMe(token)]);
        if (!cancelled) {
          setKeycloakUser(kc);
          setDbUser(db);
        }
      } catch (e) {
        if (!cancelled) setAuthError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    const token = await getValidToken();
    if (token) await registerPushToken(token, null);
    const refreshToken = await getRefreshToken();
    if (refreshToken) await authLogout(refreshToken);
    await clearTokens();
    router.replace("/login");
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const token = await getValidToken();
      if (!token) return;
      const [kc, db] = await Promise.all([getMe(token), getUserMe(token)]);
      setKeycloakUser(kc);
      setDbUser(db);
    } catch {
      // silent — user stays on screen with stale data
    }
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
        authError,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
