/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

// CityCare+ charte graphique
export const CityCareColors = {
  primary: "#f6aa54", // Orange doux — urgence maîtrisée
  accent: "#f4e044", // Jaune accentué — visibilité / attention
  secondary: "#ebe192", // Beige clair
  background: "#f9f7e9", // Fond ivoire
  text: "#090908", // Noir profond
  white: "#ffffff",
  statusRed: "#e53935", // Danger immédiat
  statusOrange: "#f6aa54", // En cours / gêne
  statusGreen: "#43a047", // Résolu
};

export const Colors = {
  light: {
    text: CityCareColors.text,
    background: CityCareColors.background,
    tint: CityCareColors.primary,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: CityCareColors.primary,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: CityCareColors.primary,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: CityCareColors.primary,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
