import { TYPE_LABEL } from "@/constants/incidents";
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
 * a accompli — combien de signalements ont abouti, sur quoi on signale le plus,
 * depuis quand. C'est la seule chose de l'écran qui donne une raison de revenir
 * quand on n'a rien à signaler.
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

  const percent = Math.round(stats.resolutionRate * 100);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialIcons name="workspace-premium" size={17} color={colors.primary} />
        <Text style={styles.title}>{t.stats.title}</Text>
      </View>

      <View style={styles.rateRow}>
        <Text style={styles.percent}>{percent}%</Text>
        <View style={styles.rateText}>
          <Text style={styles.rateLabel}>{t.stats.resolutionRate}</Text>
          <Text style={styles.rateDetail}>{t.stats.resolvedOf(stats.resolved, stats.total)}</Text>
        </View>
      </View>

      {/* La barre redit le pourcentage, et c'est voulu : un chiffre se lit, une
          barre se saisit d'un coup d'œil. */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: colors.primary }]} />
      </View>

      {stats.inProgress > 0 && (
        <Text style={styles.pending}>{t.stats.inProgress(stats.inProgress)}</Text>
      )}

      <View style={styles.divider} />

      {stats.topType && (
        <View style={styles.line}>
          <Text style={styles.lineLabel}>{t.stats.topCategory}</Text>
          <Text style={styles.lineValue}>
            {TYPE_LABEL[stats.topType.type] ?? stats.topType.type} · {stats.topType.count}
          </Text>
        </View>
      )}
      {stats.since && <Text style={styles.since}>{t.stats.since(formatDate(stats.since))}</Text>}
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
    header: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 14 },
    title: {
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: colors.text,
      opacity: 0.55,
    },
    rateRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 },
    percent: {
      fontSize: 34,
      fontWeight: "800",
      color: colors.primary,
      letterSpacing: -1,
      fontVariant: ["tabular-nums"],
    },
    rateText: { flex: 1, gap: 2 },
    rateLabel: { fontSize: 14, fontWeight: "700", color: colors.text },
    rateDetail: { fontSize: 12, color: colors.text, opacity: 0.5 },
    track: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.chipBg,
      overflow: "hidden",
    },
    fill: { height: 6, borderRadius: 3 },
    pending: { fontSize: 12, color: colors.text, opacity: 0.5, marginTop: 10 },
    divider: { height: 1, backgroundColor: colors.chipBorder, marginVertical: 14 },
    line: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    lineLabel: { fontSize: 13, color: colors.text, opacity: 0.55, flexShrink: 1 },
    lineValue: { fontSize: 13, fontWeight: "700", color: colors.text },
    since: { fontSize: 12, color: colors.text, opacity: 0.4, marginTop: 10 },
  });
}
