import { Platform } from "react-native";

const TAB_BAR_HEIGHT = 60;
const TAB_BAR_EXTRA_PADDING = 16;

export function getTabBarScrollPadding(bottomInset: number): number {
  return TAB_BAR_HEIGHT + bottomInset + (Platform.OS === "ios" ? 0 : 8) + TAB_BAR_EXTRA_PADDING;
}
