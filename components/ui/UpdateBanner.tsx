import { useAppUpdate } from "@/hooks/use-app-update";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
 */
export function UpdateBanner() {
  const { ready, applying, apply, dismiss } = useAppUpdate();
  const t = useStrings();
  const { colors, isDark } = useAppColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(isDark), [isDark]);

  if (!ready) return null;

  return (
    <View
      testID="update-banner"
      style={[styles.banner, { top: insets.top + 8, backgroundColor: colors.primary }]}
    >
      <MaterialIcons name="system-update" size={20} color="#fff" />
      <View style={styles.text}>
        <Text style={styles.title}>{t.updates.bannerTitle}</Text>
        <Text style={styles.detail}>{t.updates.bannerDetail}</Text>
      </View>
      <TouchableOpacity
        style={styles.action}
        onPress={() => void apply()}
        disabled={applying}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={t.updates.bannerApply}
      >
        {applying ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={[styles.actionLabel, { color: colors.primary }]}>{t.updates.bannerAction}</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        onPress={dismiss}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={t.updates.bannerDismiss}
      >
        <MaterialIcons name="close" size={18} color="rgba(255,255,255,0.85)" />
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(isDark: boolean) {
  return StyleSheet.create({
    banner: {
      position: "absolute",
      left: 16,
      right: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 16,
      zIndex: 9998, // Juste sous le toast : une erreur prime sur une proposition.
      elevation: 9,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.35 : 0.18,
      shadowRadius: 8,
    },
    text: { flex: 1, gap: 1 },
    title: { fontSize: 14, fontWeight: "700", color: "#fff" },
    detail: { fontSize: 12, color: "rgba(255,255,255,0.9)" },
    action: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 14,
      backgroundColor: "#fff",
      minWidth: 78,
      alignItems: "center",
    },
    actionLabel: { fontSize: 12, fontWeight: "700" },
  });
}
