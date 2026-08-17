import { GlassSurface } from "@/components/ui/GlassSurface";
import { useAppUpdate } from "@/hooks/use-app-update";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import type { AppColors } from "@/types/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useMemo } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/AppText";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Bannière de mise à jour prête.
 *
 * Elle ne prévient de rien tant qu'il n'y a rien à faire : le bundle se
 * télécharge en fond et s'appliquerait de lui-même au prochain démarrage. Elle
 * n'apparaît qu'une fois le téléchargement terminé, pour offrir le
 * rechargement immédiat à qui n'a pas envie d'attendre — un testeur, la plupart
 * du temps.
 *
 * D'où la croix : c'est une proposition. La refuser ne perd rien, la mise à
 * jour est déjà sur l'appareil.
 *
 * Côté forme, elle était un aplat de la couleur primaire, seule de son espèce :
 * l'application a pourtant un idiome pour les panneaux flottants — la surface
 * de verre du panneau de la carte et de la barre d'onglets. Elle l'emploie
 * désormais, avec la bulle d'icône pleine des en-têtes de liste, et entre en
 * glissant du haut plutôt qu'en apparaissant d'un coup : ce qui surgit sans
 * mouvement se lit comme un défaut d'affichage.
 */
const SPRING = { mass: 0.6, stiffness: 170, damping: 17 };

export function UpdateBanner() {
  const { ready, applying, apply, dismiss } = useAppUpdate();
  const t = useStrings();
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  /**
   * L'entrée seulement : la croix, elle, fait disparaître la bannière sur
   * l'instant, parce qu'un geste explicite mérite une réponse immédiate.
   *
   * La remise à zéro quand il n'y a rien à proposer n'est pas superflue. Le
   * composant est monté bien avant d'avoir quoi que ce soit à dire — il rend
   * `null` en attendant —, si bien que sans elle l'animation se jouerait à
   * vide au démarrage et la bannière apparaîtrait ensuite d'un bloc.
   */
  const slide = useSharedValue(-1);
  const fade = useSharedValue(0);

  useEffect(() => {
    if (!ready) {
      slide.value = -1;
      fade.value = 0;
      return;
    }
    slide.value = withSpring(0, SPRING);
    fade.value = withTiming(1, { duration: 220 });
  }, [ready, slide, fade]);

  const style = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: slide.value * 90 }],
  }));

  if (!ready) return null;

  return (
    <Animated.View
      testID="update-banner"
      style={[styles.wrapper, { top: insets.top + 10 }, style]}
    >
      <GlassSurface style={styles.surface}>
        {/* Le liseré coloré porte la couleur que l'aplat portait avant : la
            bannière reste reconnaissable au coin de l'œil sans crier. */}
        <View style={styles.accent} />

        <View style={styles.row}>
          <View style={styles.bubble}>
            <MaterialIcons name="system-update" size={20} color="#fff" />
          </View>

          <View style={styles.text}>
            <Text style={styles.title}>{t.updates.bannerTitle}</Text>
            <Text style={styles.detail}>{t.updates.bannerDetail}</Text>
          </View>

          <TouchableOpacity
            onPress={dismiss}
            hitSlop={12}
            style={styles.close}
            accessibilityRole="button"
            accessibilityLabel={t.updates.bannerDismiss}
          >
            <MaterialIcons name="close" size={17} color={styles.detail.color} />
          </TouchableOpacity>
        </View>

        {/* Le bouton sur sa propre ligne, pleine largeur : à trois éléments sur
            une seule, le titre se coupait au milieu d'un mot dès que la langue
            changeait, et la cible d'appui était étroite. */}
        <TouchableOpacity
          style={styles.action}
          onPress={() => void apply()}
          disabled={applying}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t.updates.bannerApply}
        >
          {applying ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialIcons name="restart-alt" size={17} color="#fff" />
              <Text style={styles.actionLabel}>{t.updates.bannerAction}</Text>
            </>
          )}
        </TouchableOpacity>
      </GlassSurface>
    </Animated.View>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    wrapper: {
      position: "absolute",
      left: 14,
      right: 14,
      zIndex: 9998, // Juste sous le toast : une erreur prime sur une proposition.
    },
    surface: { borderRadius: 22, paddingTop: 14, paddingBottom: 12, paddingHorizontal: 14, gap: 12 },
    accent: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: c.primary,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 12 },
    bubble: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    text: { flex: 1, gap: 2 },
    title: { fontSize: 14.5, fontWeight: "800", color: c.text, letterSpacing: -0.2 },
    detail: { fontSize: 12.5, color: c.text, opacity: 0.55, lineHeight: 17 },
    close: { width: 26, height: 26, alignItems: "center", justifyContent: "center" },
    action: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.primary,
    },
    actionLabel: { fontSize: 13.5, fontWeight: "700", color: "#fff" },
  });
}
