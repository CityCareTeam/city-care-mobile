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

// Espace à réserver en bas de page pour ne pas être caché par la tab bar flottante
export const TAB_BAR_HEIGHT = 60;
export const TAB_BAR_EXTRA_PADDING = 16;
export function getTabBarScrollPadding(bottomInset: number): number {
  return TAB_BAR_HEIGHT + bottomInset + (Platform.OS === "ios" ? 0 : 8) + TAB_BAR_EXTRA_PADDING;
}
