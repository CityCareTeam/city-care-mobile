import { StatusBreakdown } from "@/components/status-breakdown";
import { TYPE_LABEL } from "@/constants/incidents";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import { formatDate } from "@/utils/format-date";
import { personalStats } from "@/utils/personal-stats";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  incidents: { type: string; status: string; created_at: string }[];
};

/**
 * Bilan personnel.
 *
 * Il dit ce qu'on a accompli — combien, où ça en est, sur quoi on signale le
 * plus, depuis quand. C'est la seule chose de l'écran qui donne une raison de
 * revenir quand on n'a rien à signaler.
 *
 * Il partage sa mise en page avec le bilan de la ville : même question, même
 * forme. Ce qui lui appartient — la catégorie de prédilection, l'ancienneté —
 * vit dans son pied.
 *
 * Les chiffres portent sur la liste complète des signalements de l'utilisateur,
 * jamais sur les pages chargées du fil : un taux calculé sur un échantillon
 * n'est pas un taux.
 */
export function PersonalStatsCard({ incidents }: Props) {
  const { colors } = useAppColors();
  const t = useStrings();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const stats = useMemo(() => personalStats(incidents), [incidents]);

  if (stats.total === 0) return null;

  return (
    <StatusBreakdown
      title={t.stats.title}
      icon="workspace-premium"
      total={stats.total}
      resolved={stats.resolved}
      inProgress={stats.inProgress}
      reported={stats.reported}
    >
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
    </StatusBreakdown>
  );
}

function makeStyles(colors: ReturnType<typeof useAppColors>["colors"]) {
  return StyleSheet.create({
    divider: { height: 1, backgroundColor: colors.chipBorder, marginVertical: 14 },
    footer: { gap: 8 },
    footerItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    footerLabel: { fontSize: 13, color: colors.text, opacity: 0.55, flexShrink: 1 },
    footerValue: { fontSize: 13, fontWeight: "700", color: colors.text },
    since: { fontSize: 12, color: colors.text, opacity: 0.4 },
  });
}
