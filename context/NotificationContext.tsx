import Constants from "expo-constants";
import { getUnreadCount } from "@/services/notifications";
import { getValidToken } from "@/storage/tokens";
import { usePushToken } from "@/hooks/use-push-token";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

// Les push distants ne fonctionnent pas dans Expo Go depuis SDK 53
const isExpoGo = Constants.appOwnership === "expo";

// Import dynamique pour éviter les side-effects du module au chargement dans Expo Go
if (!isExpoGo) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Notifications = require("expo-notifications") as typeof import("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

type NotificationContextValue = {
  unreadCount: number;
  refreshCount: () => void;
};

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  refreshCount: () => {},
});

export function useNotificationContext() {
  return useContext(NotificationContext);
}

const POLL_INTERVAL_MS = 30_000;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  usePushToken(isAuthenticated);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCount = useCallback(async () => {
    if (!isAuthenticated) return;
    const token = await getValidToken();
    if (!token) return;
    const count = await getUnreadCount(token);
    setUnreadCount(count);
  }, [isAuthenticated]);

  useEffect(() => {
    if (loading || !isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    void fetchCount();
    timerRef.current = setInterval(() => void fetchCount(), POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, isAuthenticated, fetchCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshCount: fetchCount }}>
      {children}
    </NotificationContext.Provider>
  );
}
