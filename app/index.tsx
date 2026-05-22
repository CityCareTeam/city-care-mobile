import { CityCareColors } from "@/constants/theme";
import { refreshToken } from "@/services/auth";
import {
    clearTokens,
    getAccessToken,
    getRefreshToken,
    isTokenExpired,
    saveTokens,
} from "@/storage/tokens";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const [target, setTarget] = useState<"/login" | "/(tabs)" | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const access = await getAccessToken();

      // Pas de token → login
      if (!access) {
        setTarget("/login");
        return;
      }

      // Token valide → tabs
      if (!isTokenExpired(access)) {
        setTarget("/(tabs)");
        return;
      }

      // Access token expiré → essayer le refresh
      const refresh = await getRefreshToken();
      if (!refresh || isTokenExpired(refresh)) {
        await clearTokens();
        setTarget("/login");
        return;
      }

      try {
        const tokens = await refreshToken(refresh);
        await saveTokens(tokens.accessToken, tokens.refreshToken);
        setTarget("/(tabs)");
      } catch {
        await clearTokens();
        setTarget("/login");
      }
    }

    checkAuth();
  }, []);

  if (!target) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: CityCareColors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={CityCareColors.primary} />
      </View>
    );
  }

  return <Redirect href={target} />;
}
