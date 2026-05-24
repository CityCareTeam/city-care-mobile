import { CityCareColors, CityCareColorsDark } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export type AppColors = typeof CityCareColors;

export function useAppColors(): { isDark: boolean; colors: AppColors } {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return { isDark, colors: isDark ? CityCareColorsDark : CityCareColors };
}
