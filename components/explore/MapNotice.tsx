import { GlassSurface } from "@/components/ui/GlassSurface";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import type { Dictionary } from "@/constants/i18n";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type MapNoticeKind = "offline" | "empty" | "filtered";

const ICONS: Record<MapNoticeKind, React.ComponentProps<typeof MaterialIcons>["name"]> = {
  offline: "cloud-off",
  empty: "explore",
  filtered: "filter-alt-off",
};

/**
 * Construit au rendu : cette table était une constante de module, donc figée à
 * l'import — elle serait restée en français quelle que soit la langue choisie.
 */
function notices(t: Dictionary): Record<MapNoticeKind, { title: string; detail: string }> {
  return {
    offline: { title: t.mapNotice.unavailableTitle, detail: t.mapNotice.unavailableDetail },
    empty: { title: t.mapNotice.emptyTitle, detail: t.mapNotice.emptyDetail },
    filtered: { title: t.mapNotice.noResultsTitle, detail: t.mapNotice.noResultsDetail },
  };
}

type Props = {
  kind: MapNoticeKind;
  top: number;
  /** Proposé uniquement quand une nouvelle tentative peut changer le résultat. */
  onRetry?: () => void;
};

/**
 * Une carte vide et une carte qui n'a pas pu charger se ressemblaient trait
 * pour trait. Ce panneau les sépare, et ne propose de réessayer que lorsque
 * c'est le réseau qui a échoué — relancer un filtre qui ne donne rien
 * n'apporterait rien.
 */
export function MapNotice({ kind, top, onRetry }: Props) {
  const { colors, isDark } = useAppColors();
  const t = useStrings();
  const styles = useMemo(() => makeStyles(isDark), [isDark]);
  const notice = notices(t)[kind];

  return (
    <GlassSurface style={[styles.surface, { top }]}>
      <MaterialIcons
        name={ICONS[kind]}
        size={20}
        color={kind === "offline" ? colors.primary : styles.title.color}
      />
      <View style={styles.text}>
        <Text style={styles.title}>{notice.title}</Text>
        <Text style={styles.detail}>{notice.detail}</Text>
      </View>
      {onRetry && (
        <TouchableOpacity
          style={styles.retry}
          onPress={onRetry}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t.mapNotice.retryA11y}
        >
          <Text style={styles.retryLabel}>{t.mapNotice.retry}</Text>
        </TouchableOpacity>
      )}
    </GlassSurface>
  );
}

function makeStyles(isDark: boolean) {
  return StyleSheet.create({
    surface: {
      position: "absolute",
      left: 16,
      right: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    text: { flex: 1, gap: 2 },
    title: {
      fontSize: 14,
      fontWeight: "700",
      color: isDark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.82)",
    },
    detail: {
      fontSize: 12,
      lineHeight: 16,
      color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)",
    },
    retry: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 14,
      backgroundColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.07)",
    },
    retryLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: isDark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.75)",
    },
  });
}
