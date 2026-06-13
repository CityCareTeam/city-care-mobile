import { ToastMessage } from "@/components/ui/ToastMessage";
import { CityCareColors, CityCareColorsDark } from "@/constants/theme";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "login",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const c = colorScheme === "dark" ? CityCareColorsDark : CityCareColors;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack initialRouteName="login">
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="report"
            options={{
              presentation: "modal",
              title: "Signaler un incident",
              headerStyle: { backgroundColor: c.background },
              headerTintColor: c.primary,
              headerTitleStyle: { fontWeight: "700", color: c.text },
            }}
          />
        </Stack>
        <StatusBar style="auto" />
        <ToastMessage />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
