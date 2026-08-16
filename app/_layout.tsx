import { ToastMessage } from "@/components/ui/ToastMessage";
import { UpdateBanner } from "@/components/ui/UpdateBanner";
import { CityCareColors, CityCareColorsDark } from "@/constants/theme";
import { PreferencesProvider } from "@/context/PreferencesContext";
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

/**
 * Le contenu est séparé de la racine parce qu'il lit la préférence de thème :
 * un composant ne peut pas consommer un contexte qu'il fournit lui-même.
 */
function RootContent() {
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
        <UpdateBanner />
        <ToastMessage />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <PreferencesProvider>
      <RootContent />
    </PreferencesProvider>
  );
}
