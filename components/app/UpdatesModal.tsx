import { ModalShell } from "@/components/ui/ModalShell";
import { useAppColors } from "@/hooks/use-app-colors";
import { checkAndFetchUpdate, useAppUpdate, useRunningUpdate } from "@/hooks/use-app-update";
import { useStrings } from "@/hooks/use-strings";
import { appVersion } from "@/utils/app-version";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Updates from "expo-updates";
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Status = "idle" | "checking" | "up-to-date" | "downloaded" | "unavailable" | "failed";



/**
 * État des mises à jour, et bouton pour en chercher une.
 *
 * La bannière automatique ne se montre qu'au moment où une mise à jour finit
 * d'arriver. Qui n'était pas devant l'écran à cet instant n'a aucun moyen de
 * savoir où il en est — c'est ce que cet écran répare. Il dit ce qui tourne, et
 * permet de demander explicitement.
 */
export function UpdatesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, isDark } = useAppColors();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const [status, setStatus] = useState<Status>("idle");
  const { ready, applying, apply } = useAppUpdate();
  const bundle = useRunningUpdate();
  const t = useStrings();

  const messages: Record<Exclude<Status, "idle" | "checking">, string> = {
    "up-to-date": t.updates.upToDate,
    downloaded: t.updates.downloaded,
    unavailable: t.updates.unavailable,
    failed: t.updates.failed,
  };

  async function check() {
    setStatus("checking");
    setStatus(await checkAndFetchUpdate());
  }

  const pending = ready || status === "downloaded";

  return (
    <ModalShell visible={visible} title={t.updates.title} onClose={onClose}>
      {/* L'état d'abord, en gros : c'est la seule question qu'on se pose en
          ouvrant cet écran. Le détail vient après, pour qui le cherche. */}
      <View style={styles.hero}>
        <View
          style={[
            styles.heroIcon,
            { backgroundColor: pending ? colors.primary : colors.primary + "1F" },
          ]}
        >
          <MaterialIcons
            name={pending ? "system-update" : "check"}
            size={26}
            color={pending ? "#fff" : colors.primary}
          />
        </View>
        <Text style={styles.heroTitle}>
          {pending ? t.updates.ready : t.updates.upToDateTitle}
        </Text>
        <Text style={styles.heroDetail}>
          {status !== "idle" && status !== "checking"
            ? messages[status]
            : pending
              ? t.updates.applyHint
              : t.updates.none}
        </Text>
      </View>

      <View style={styles.rows}>
        <Row label={t.updates.installedVersion} value={appVersion()} styles={styles} />
        <Row
          label={t.updates.runningBundle}
          // Sans identifiant, c'est celui livré avec l'application : le dire
          // vaut mieux qu'un tiret, qui se lit comme une donnée manquante.
          value={bundle || t.updates.embedded}
          styles={styles}
        />
        <Row label={t.updates.channel} value={Updates.channel ?? t.updates.noChannel} styles={styles} last />
      </View>

      {pending ? (
        <TouchableOpacity
          style={[styles.action, { backgroundColor: colors.primary }]}
          onPress={() => void apply()}
          disabled={applying}
          accessibilityRole="button"
          accessibilityLabel={t.updates.relaunch}
        >
          {applying ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.actionLabel}>{t.updates.relaunch}</Text>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.action, { backgroundColor: colors.primary }]}
          onPress={() => void check()}
          disabled={status === "checking"}
          accessibilityRole="button"
          accessibilityLabel={t.updates.check}
        >
          {status === "checking" ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.actionLabel}>{t.updates.check}</Text>
          )}
        </TouchableOpacity>
      )}
    </ModalShell>
  );
}

function Row({
  label,
  value,
  last = false,
  styles,
}: {
  label: string;
  value: string;
  last?: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useAppColors>["colors"], isDark: boolean) {
  return StyleSheet.create({
    hero: { alignItems: "center", gap: 8, paddingBottom: 22 },
    heroIcon: {
      width: 56,
      height: 56,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 2,
    },
    heroTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
    heroDetail: {
      fontSize: 12.5,
      color: colors.text,
      opacity: 0.55,
      textAlign: "center",
      lineHeight: 18,
      paddingHorizontal: 8,
    },
    rows: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.chipBorder,
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : colors.chipBg,
      marginBottom: 16,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.chipBorder,
    },
    rowLast: { borderBottomWidth: 0 },
    rowLabel: { fontSize: 13, color: colors.text, opacity: 0.6 },
    rowValue: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      flexShrink: 1,
      fontVariant: ["tabular-nums"],
    },
    action: {
      borderRadius: 14,
      paddingVertical: 13,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 46,
    },
    actionLabel: { fontSize: 14, fontWeight: "700", color: "#fff" },
  });
}
