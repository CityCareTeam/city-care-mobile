import { GlassSurface } from "@/components/ui/GlassSurface";
import { useAppColors } from "@/hooks/use-app-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type MapNoticeKind = "offline" | "empty" | "filtered";

const NOTICE = {
  offline: {
    icon: "cloud-off",
    title: "Données indisponibles",
    detail: "Impossible de joindre le serveur.",
  },
  empty: {
    icon: "explore",
    title: "Aucun signalement",
    detail: "Personne n'a encore signalé quoi que ce soit ici.",
  },
  filtered: {
    icon: "filter-alt-off",
    title: "Aucun résultat",
    detail: "Aucun signalement ne correspond à ces filtres.",
  },
} as const satisfies Record<
  MapNoticeKind,
  { icon: React.ComponentProps<typeof MaterialIcons>["name"]; title: string; detail: string }
>;

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
  const styles = useMemo(() => makeStyles(isDark), [isDark]);
  const notice = NOTICE[kind];

  return (
    <GlassSurface style={[styles.surface, { top }]}>
      <MaterialIcons
        name={notice.icon}
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
          accessibilityLabel="Réessayer le chargement"
        >
          <Text style={styles.retryLabel}>Réessayer</Text>
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
