import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
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
      try {
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
        if (finalStatus !== "granted") {
          console.warn("[push] permission refusée:", finalStatus);
          return;
        }

        const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
        if (!projectId) {
          console.warn("[push] projectId manquant dans app.config.ts");
          return;
        }

        const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
        console.log("[push] token récupéré:", pushToken);

        const token = await getValidToken();
        if (!token) {
          console.warn("[push] pas de JWT valide");
          return;
        }
        await registerPushToken(token, pushToken);
      } catch (e) {
        console.error("[push] erreur inattendue:", e);
      }
    })();
  }, [isAuthenticated]);
}
