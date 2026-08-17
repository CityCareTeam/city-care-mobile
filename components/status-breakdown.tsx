import { STATUS_COLOR } from "@/constants/incidents";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/AppText";

type Props = {
  title: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  total: number;
  resolved: number;
  inProgress: number;
  reported: number;
  /** Pied de carte : ce que chaque bilan a de particulier. */
  children?: React.ReactNode;
};

/**
 * Un bilan : un total, une barre segmentée, sa légende.
 *
 * Écrit une fois pour les deux onglets. Le bilan personnel et celui de la ville
 * répondent à la même question — combien, et où ça en est — et deux mises en
 * page différentes auraient donné l'impression de deux mesures différentes.
 *
 * Les segments prennent les couleurs de statut employées partout ailleurs :
 * l'orange d'« en cours » sur cette barre est celui des épingles de la carte et
 * des pastilles du fil.
 */
export function StatusBreakdown({
  title,
  icon,
  total,
  resolved,
  inProgress,
  reported,
  children,
}: Props) {
  const { colors, isDark } = useAppColors();
  const t = useStrings();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  // Un segment vide n'a pas de largeur : l'afficher ferait une couleur qu'on ne
  // sait pas expliquer, et une légende qui annonce « 0 résolus ».
  const segments = [
    { key: "resolved", count: resolved, color: STATUS_COLOR.resolved, label: t.stats.resolved },
    { key: "in_progress", count: inProgress, color: STATUS_COLOR.in_progress, label: t.stats.pending },
    { key: "reported", count: reported, color: STATUS_COLOR.reported, label: t.stats.open },
  ].filter((segment) => segment.count > 0);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialIcons name={icon} size={17} color={colors.primary} />
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.total}>{total}</Text>
        <Text style={styles.totalLabel}>{t.stats.reports(total)}</Text>
      </View>

      <View style={styles.track}>
        {segments.map((segment) => (
          <View key={segment.key} style={{ flex: segment.count, backgroundColor: segment.color }} />
        ))}
      </View>

      <View style={styles.legend}>
        {segments.map((segment) => (
          <View key={segment.key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: segment.color }]} />
            <Text style={styles.legendText}>
              {segment.count} {segment.label}
            </Text>
          </View>
        ))}
      </View>

      {children}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useAppColors>["colors"], isDark: boolean) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.white,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.chipBorder,
      padding: 16,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    header: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 12 },
    title: {
      flex: 1,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: colors.text,
      opacity: 0.55,
    },
    totalRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 12 },
    total: {
      fontSize: 34,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: -1,
      fontVariant: ["tabular-nums"],
    },
    totalLabel: { fontSize: 14, color: colors.text, opacity: 0.5 },
    track: {
      flexDirection: "row",
      height: 8,
      borderRadius: 4,
      overflow: "hidden",
      backgroundColor: colors.chipBg,
      gap: 2,
    },
    legend: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 12 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    dot: { width: 7, height: 7, borderRadius: 3.5 },
    legendText: { fontSize: 12, color: colors.text, opacity: 0.6 },
  });
}
