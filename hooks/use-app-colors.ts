import { CityCareColors, CityCareColorsDark } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { AppColors } from "@/types/theme";

export type { AppColors };

export function useAppColors(): { isDark: boolean; colors: AppColors } {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return { isDark, colors: isDark ? CityCareColorsDark : CityCareColors };
}
