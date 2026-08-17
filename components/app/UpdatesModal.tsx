import { ModalShell } from "@/components/ui/ModalShell";
import { useAppColors } from "@/hooks/use-app-colors";
import { checkAndFetchUpdate, useAppUpdate, useRunningUpdate } from "@/hooks/use-app-update";
import { useStrings } from "@/hooks/use-strings";
import { appVersion } from "@/utils/app-version";
import { mixHex } from "@/utils/color";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Updates from "expo-updates";
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Status = "idle" | "checking" | "up-to-date" | "downloaded" | "unavailable" | "failed";

type Icon = React.ComponentProps<typeof MaterialIcons>["name"];

const SUCCESS = "#4caf50";
const DANGER = "#e53e3e";

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

  async function check() {
    setStatus("checking");
    setStatus(await checkAndFetchUpdate());
  }

  const pending = ready || status === "downloaded";
  const checking = status === "checking";
  const broken = status === "failed" || status === "unavailable";

  /**
   * L'état a désormais une couleur, et c'est le vrai apport de cette
   * mise en forme : la bande était orange en toutes circonstances, si bien
   * qu'« à jour », « mise à jour prête » et « recherche impossible » se
   * ressemblaient. Le vert dit qu'il n'y a rien à faire, l'orange qu'il y a
   * quelque chose à faire, le rouge que ça n'a pas marché.
   */
  const tone = broken ? DANGER : pending || checking ? colors.primary : SUCCESS;

  const icon: Icon = pending
    ? "system-update"
    : status === "failed"
      ? "cloud-off"
      : status === "unavailable"
        ? "info-outline"
        : "check-circle";

  const title = checking
    ? t.updates.checking
    : pending
      ? t.updates.ready
      : status === "failed"
        ? t.updates.failedTitle
        : status === "unavailable"
          ? t.updates.unavailableTitle
          : t.updates.upToDateTitle;

  const detail = checking
    ? t.updates.checkingDetail
    : pending
      ? t.updates.applyHint
      : status === "up-to-date"
        ? t.updates.upToDate
        : status === "failed"
          ? t.updates.failed
          : status === "unavailable"
            ? t.updates.unavailable
            : t.updates.none;

  return (
    <ModalShell visible={visible} title={t.updates.title} onClose={onClose}>
      {/* La même bande teintée que les en-têtes de notifications et d'actus, au
          lieu d'une icône centrée sur du vide : la fenêtre cesse d'avoir l'air
          d'appartenir à une autre application. La teinte est calculée et non
          superposée — un fond translucide laisse voir les ombres à travers sur
          Android. */}
      <View style={[styles.state, { backgroundColor: mixHex(colors.white, tone, 0.14) }]}>
        <View style={[styles.bubble, { backgroundColor: tone }]}>
          {checking ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons name={icon} size={24} color="#fff" />
          )}
        </View>
        <View style={styles.stateText}>
          <Text style={styles.stateTitle}>{title}</Text>
          <Text style={styles.stateDetail}>{detail}</Text>
        </View>
      </View>

      <View style={styles.rows}>
        <Row icon="label" label={t.updates.installedVersion} value={appVersion()} styles={styles} />
        <Row
          icon="layers"
          label={t.updates.runningBundle}
          // Sans identifiant, c'est celui livré avec l'application : le dire
          // vaut mieux qu'un tiret, qui se lit comme une donnée manquante.
          value={bundle || t.updates.embedded}
          styles={styles}
        />
        <Row
          icon="alt-route"
          label={t.updates.channel}
          value={Updates.channel ?? t.updates.noChannel}
          styles={styles}
          last
        />
      </View>

      <TouchableOpacity
        style={[styles.action, { backgroundColor: pending ? colors.primary : mixHex(colors.white, colors.primary, 0.12) }]}
        onPress={() => void (pending ? apply() : check())}
        disabled={applying || checking}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={pending ? t.updates.relaunch : t.updates.check}
      >
        {applying || checking ? (
          <ActivityIndicator size="small" color={pending ? "#fff" : colors.primary} />
        ) : (
          <>
            <MaterialIcons
              name={pending ? "restart-alt" : "refresh"}
              size={18}
              color={pending ? "#fff" : colors.primary}
            />
            {/* Rechercher est une action ordinaire, relancer une action qu'on
                vient d'annoncer : la première reste discrète, la seconde est
                pleine. Sans cette différence les deux se valaient à l'œil, et
                le bouton n'appelait jamais l'appui. */}
            <Text style={[styles.actionLabel, { color: pending ? "#fff" : colors.primary }]}>
              {pending ? t.updates.relaunch : t.updates.check}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ModalShell>
  );
}

function Row({
  icon,
  label,
  value,
  last = false,
  styles,
}: {
  icon: Icon;
  label: string;
  value: string;
  last?: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <MaterialIcons name={icon} size={15} color={styles.rowLabel.color} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useAppColors>["colors"], isDark: boolean) {
  return StyleSheet.create({
    state: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      padding: 14,
      borderRadius: 20,
      marginBottom: 16,
    },
    bubble: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: "center",
      justifyContent: "center",
    },
    stateText: { flex: 1, gap: 2 },
    stateTitle: { fontSize: 15.5, fontWeight: "800", color: colors.text, letterSpacing: -0.2 },
    stateDetail: { fontSize: 12.5, color: colors.text, opacity: 0.6, lineHeight: 17 },

    rows: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.chipBorder,
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : colors.chipBg,
      marginBottom: 16,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      paddingHorizontal: 13,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.chipBorder,
    },
    rowLast: { borderBottomWidth: 0 },
    rowIcon: { opacity: 0.75 },
    rowLabel: { flex: 1, fontSize: 13, color: colors.text, opacity: 0.6 },
    rowValue: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      flexShrink: 1,
      fontVariant: ["tabular-nums"],
    },

    action: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 16,
      paddingVertical: 13,
      minHeight: 48,
    },
    actionLabel: { fontSize: 14, fontWeight: "700" },
  });
}
