import { ModalShell } from "@/components/ui/ModalShell";
import { useAppColors } from "@/hooks/use-app-colors";
import { checkAndFetchUpdate, useAppUpdate, useRunningUpdate } from "@/hooks/use-app-update";
import { appVersion } from "@/utils/app-version";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Updates from "expo-updates";
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Status = "idle" | "checking" | "up-to-date" | "downloaded" | "unavailable" | "failed";

const MESSAGES: Record<Exclude<Status, "idle" | "checking">, string> = {
  "up-to-date": "Vous avez déjà la dernière version.",
  downloaded: "Mise à jour téléchargée. Relancez pour l’appliquer.",
  unavailable: "Les mises à jour ne sont pas actives sur cette installation.",
  failed: "Recherche impossible. Vérifiez votre connexion.",
};

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

  async function check() {
    setStatus("checking");
    setStatus(await checkAndFetchUpdate());
  }

  return (
    <ModalShell visible={visible} title="Mises à jour" onClose={onClose}>
      <View style={styles.rows}>
        <Row label="Version installée" value={appVersion()} styles={styles} />
        <Row
          label="Bundle en cours"
          // Sans identifiant, c'est celui livré avec l'application : le dire
          // vaut mieux qu'un tiret, qui se lit comme une donnée manquante.
          value={bundle || "Livré avec l’application"}
          styles={styles}
        />
        <Row label="Canal" value={Updates.channel ?? "aucun"} styles={styles} last />
      </View>

      {status !== "idle" && status !== "checking" && (
        <View style={styles.notice}>
          <MaterialIcons
            name={status === "downloaded" ? "system-update" : status === "up-to-date" ? "check-circle" : "info"}
            size={16}
            color={colors.primary}
          />
          <Text style={styles.noticeText}>{MESSAGES[status]}</Text>
        </View>
      )}

      {ready || status === "downloaded" ? (
        <TouchableOpacity
          style={[styles.action, { backgroundColor: colors.primary }]}
          onPress={() => void apply()}
          disabled={applying}
          accessibilityRole="button"
          accessibilityLabel="Relancer l’application pour appliquer la mise à jour"
        >
          {applying ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.actionLabel}>Relancer maintenant</Text>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.action, { backgroundColor: colors.primary }]}
          onPress={() => void check()}
          disabled={status === "checking"}
          accessibilityRole="button"
          accessibilityLabel="Rechercher une mise à jour"
        >
          {status === "checking" ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.actionLabel}>Rechercher une mise à jour</Text>
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
    notice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.primary + "14",
      marginBottom: 16,
    },
    noticeText: { flex: 1, fontSize: 12, color: colors.text, opacity: 0.8 },
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
