/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

// CityCare+ charte graphique — mode clair
export const CityCareColors = {
  primary: "#f6aa54",
  accent: "#f4e044",
  secondary: "#ebe192",
  background: "#f9f7e9",
  text: "#090908",
  white: "#ffffff",
  statusRed: "#e53935",
  statusOrange: "#f6aa54",
  statusGreen: "#43a047",
  inputBg: "#ffffff",
  inputBorder: "#e0ddd0",
  chipBg: "#f4f2ea",
  chipBorder: "#e0ddd0",
  loaderOverlay: "rgba(249,247,233,0.6)",
};

// CityCare+ charte graphique — mode sombre
export const CityCareColorsDark: typeof CityCareColors = {
  primary: "#f6aa54",
  accent: "#f4e044",
  secondary: "#3d3b2f",
  background: "#1a1a16",
  text: "#f0ede0",
  white: "#252520",
  statusRed: "#e53935",
  statusOrange: "#f6aa54",
  statusGreen: "#43a047",
  inputBg: "#2a2a25",
  inputBorder: "#4a4840",
  chipBg: "#2a2a25",
  chipBorder: "#4a4840",
  loaderOverlay: "rgba(26,26,22,0.6)",
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
    text: CityCareColorsDark.text,
    background: CityCareColorsDark.background,
    tint: CityCareColorsDark.primary,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: CityCareColorsDark.primary,
  },
};

// Espace à réserver en bas de page pour ne pas être caché par la tab bar flottante
export const TAB_BAR_SCROLL_PADDING = 60 + (Platform.OS === "ios" ? 28 : 16) + 16;

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
