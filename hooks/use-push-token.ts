import Constants from "expo-constants";
import { useEffect } from "react";
import { Platform } from "react-native";
import { registerPushToken } from "@/services/notifications";
import { getValidToken } from "@/storage/tokens";

// Les push distants ne fonctionnent pas dans Expo Go depuis SDK 53
const isExpoGo = Constants.appOwnership === "expo";

export function usePushToken(isAuthenticated: boolean) {
  useEffect(() => {
    if (!isAuthenticated || isExpoGo) return;

    void (async () => {
      // Import dynamique : évite que le module charge ses side-effects dans Expo Go
      const Notifications = await import("expo-notifications");

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "CityCare+",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#f6aa54",
        });
      }

      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") return;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
      if (!projectId) return;

      const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });

      const token = await getValidToken();
      if (!token) return;
      await registerPushToken(token, pushToken);
    })();
  }, [isAuthenticated]);
}
