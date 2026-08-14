import { useAppColors } from "@/hooks/use-app-colors";
import type { AppColors } from "@/types/theme";
import { BlurView } from "expo-blur";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { Platform, StyleProp, StyleSheet, View, ViewProps, ViewStyle } from "react-native";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Laisse passer les gestes vers la carte en dessous. */
  transparentToTouch?: boolean;
  onLayout?: ViewProps["onLayout"];
};

/**
 * Le panneau flottant de l'application.
 *
 * Sur iOS c'est un vrai flou. Sur Android, `expo-blur` ne floute pas : il pose
 * un aplat de la teinte demandée, ce qui donnait une dalle grise franchement
 * visible dès que la surface s'agrandissait. On y peint donc directement le
 * fond du thème, presque opaque — plus lisible, et sans le coût d'un flou qui
 * n'en est pas un, ce qui compte sur une carte qu'on fait glisser.
 */
const USE_BLUR = Platform.OS === "ios";

export function GlassSurface({ children, style, transparentToTouch = false, onLayout }: Props) {
  const { colors, isDark } = useAppColors();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  return (
    <View
      style={[styles.surface, style]}
      pointerEvents={transparentToTouch ? "none" : "auto"}
      onLayout={onLayout}
    >
      {USE_BLUR && (
        <>
          <BlurView
            style={StyleSheet.absoluteFillObject}
            intensity={isDark ? 55 : 75}
            tint={isDark ? "dark" : "light"}
          />
          <View style={styles.veil} pointerEvents="none" />
        </>
      )}
      {children}
    </View>
  );
}

function makeStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    surface: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
      overflow: "hidden",
      // Transparent sous iOS : c'est le flou qui fait le fond.
      backgroundColor: USE_BLUR ? "transparent" : colors.white + "F2",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    veil: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? "rgba(25,25,30,0.40)" : "rgba(255,255,255,0.30)",
    },
  });
}
