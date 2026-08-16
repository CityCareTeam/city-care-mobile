import { STATUS_COLOR, TYPE_LABEL } from "@/constants/incidents";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import { formatDate } from "@/utils/format-date";
import { personalStats } from "@/utils/personal-stats";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  incidents: { type: string; status: string; created_at: string }[];
};

/**
 * Bilan personnel.
 *
 * Les compteurs juste au-dessus disent l'état du moment ; celui-ci dit ce qu'on
 * a accompli — combien, où ça en est, sur quoi on signale le plus, depuis quand.
 * C'est la seule chose de l'écran qui donne une raison de revenir quand on n'a
 * rien à signaler.
 *
 * Il a d'abord affiché un seul taux de résolution. Un pourcentage résume, mais
 * il efface : « 50 % » se lit pareil avec deux signalements ou deux cents, et
 * ne dit rien de ce qui reste en attente. La barre segmentée montre les trois
 * états dans leurs proportions réelles, avec les couleurs déjà utilisées
 * partout ailleurs pour les dire.
 *
 * Les chiffres portent sur la liste complète des signalements de l'utilisateur,
 * jamais sur les pages chargées du fil : un taux calculé sur un échantillon
 * n'est pas un taux.
 */
export function PersonalStatsCard({ incidents }: Props) {
  const { colors, isDark } = useAppColors();
  const t = useStrings();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const stats = useMemo(() => personalStats(incidents), [incidents]);

  if (stats.total === 0) return null;

  const segments = [
    { key: "resolved", count: stats.resolved, color: STATUS_COLOR.resolved, label: t.stats.resolved },
    { key: "in_progress", count: stats.inProgress, color: STATUS_COLOR.in_progress, label: t.stats.pending },
    { key: "reported", count: stats.reported, color: STATUS_COLOR.reported, label: t.stats.open },
  ].filter((segment) => segment.count > 0);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialIcons name="workspace-premium" size={17} color={colors.primary} />
        <Text style={styles.title}>{t.stats.title}</Text>
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.total}>{stats.total}</Text>
        <Text style={styles.totalLabel}>{t.stats.reports(stats.total)}</Text>
      </View>

      {/* Une barre par état, à la largeur de sa part. Elle remplace un
          pourcentage unique qui se lisait pareil avec deux signalements ou deux
          cents. */}
      <View style={styles.track}>
        {segments.map((segment) => (
          <View
            key={segment.key}
            style={{ flex: segment.count, backgroundColor: segment.color }}
          />
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

      <View style={styles.divider} />

      <View style={styles.footer}>
        {stats.topType && (
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>{t.stats.topCategory}</Text>
            <Text style={styles.footerValue}>
              {TYPE_LABEL[stats.topType.type] ?? stats.topType.type} · {stats.topType.count}
            </Text>
          </View>
        )}
        {stats.since && <Text style={styles.since}>{t.stats.since(formatDate(stats.since))}</Text>}
      </View>
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
      marginBottom: 24,
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
    divider: { height: 1, backgroundColor: colors.chipBorder, marginVertical: 14 },
    footer: { gap: 8 },
    footerItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    footerLabel: { fontSize: 13, color: colors.text, opacity: 0.55, flexShrink: 1 },
    footerValue: { fontSize: 13, fontWeight: "700", color: colors.text },
    since: { fontSize: 12, color: colors.text, opacity: 0.4 },
  });
}
