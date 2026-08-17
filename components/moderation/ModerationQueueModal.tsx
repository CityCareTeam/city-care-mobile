import { ModalShell } from "@/components/ui/ModalShell";
import { Toast } from "@/components/ui/ToastMessage";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import {
  decideOnFlag,
  getModerationQueue,
  MODERATION_UNAVAILABLE,
  type FlaggedContent,
} from "@/services/moderation";
import { getValidToken } from "@/storage/tokens";
import { timeAgo } from "@/utils/format-date";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type State = "loading" | "ready" | "unavailable" | "failed";

/**
 * File de modération, pour les agents et les administrateurs.
 *
 * Elle montre les contenus signalés, le plus signalé d'abord, avec un extrait —
 * juger demande de lire, et ouvrir chaque fiche pour cela ferait perdre la file.
 *
 * Deux décisions de même poids : masquer, ou garder et clore. « Garder » n'est
 * pas une non-décision — c'est un arbitrage, il ferme le signalement et doit
 * laisser une trace comme l'autre.
 *
 * Chaque entrée s'ouvre aussi, parce qu'un extrait suffit au cas franc et pas au
 * cas douteux : il manque le ton du fil, les photos, l'historique. La navigation
 * remonte à l'écran — un composant ne route pas de lui-même ici.
 *
 * Si le serveur ne connaît pas ces routes, l'écran le dit en propre au lieu
 * d'afficher une erreur : un endpoint absent n'est pas une panne, et le présenter
 * comme telle enverrait chercher un problème là où il n'y en a pas.
 */
export function ModerationQueueModal({
  visible,
  onClose,
  onOpenContent,
}: {
  visible: boolean;
  onClose: () => void;
  /** Ouvre l'incident concerné, sur son fil quand le contenu visé est un message. */
  onOpenContent?: (incidentId: string, onMessage: boolean) => void;
}) {
  const { colors } = useAppColors();
  const t = useStrings();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [state, setState] = useState<State>("loading");
  const [items, setItems] = useState<FlaggedContent[]>([]);
  const [deciding, setDeciding] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const token = await getValidToken();
      if (!token) throw new Error("no token");
      const queue = await getModerationQueue(token);
      // Le plus signalé d'abord, puis le plus ancien : dix personnes qui
      // signalent la même chose ont plus urgemment raison qu'une seule.
      setItems(
        [...queue].sort(
          (a, b) => b.count - a.count || a.firstFlaggedAt.localeCompare(b.firstFlaggedAt),
        ),
      );
      setState("ready");
    } catch (e) {
      setState(
        e instanceof Error && e.message === MODERATION_UNAVAILABLE ? "unavailable" : "failed",
      );
    }
  }, []);

  useEffect(() => {
    if (visible) void load();
  }, [visible, load]);

  async function decide(flag: FlaggedContent, decision: "hide" | "keep") {
    setDeciding(flag.id);
    try {
      const token = await getValidToken();
      if (!token) throw new Error("no token");
      await decideOnFlag(flag.id, decision, token);
      // Retiré de la liste sur place : l'attente d'un rechargement ferait
      // douter que l'appui ait porté.
      setItems((current) => current.filter((kept) => kept.id !== flag.id));
      Toast.show({ type: "success", text1: t.moderation.decided });
    } catch {
      Toast.show({ type: "error", text1: t.alert.errorTitle, text2: t.moderation.decideFailed });
    } finally {
      setDeciding(null);
    }
  }

  return (
    <ModalShell visible={visible} title={t.moderation.queueTitle} onClose={onClose}>
      {state === "loading" && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {state === "unavailable" && (
        <View style={styles.center}>
          <MaterialIcons name="construction" size={28} color={colors.text + "40"} />
          <Text style={styles.notice}>{t.moderation.notReady}</Text>
        </View>
      )}

      {state === "failed" && (
        <View style={styles.center}>
          <MaterialIcons name="cloud-off" size={28} color={colors.text + "40"} />
          <Text style={styles.notice}>{t.moderation.queueFailed}</Text>
          <TouchableOpacity onPress={() => void load()} style={styles.retry} accessibilityRole="button">
            <Text style={styles.retryLabel}>{t.mapNotice.retry}</Text>
          </TouchableOpacity>
        </View>
      )}

      {state === "ready" && items.length === 0 && (
        <View style={styles.center}>
          <MaterialIcons name="verified" size={28} color={colors.text + "40"} />
          <Text style={styles.notice}>{t.moderation.queueEmpty}</Text>
        </View>
      )}

      {state === "ready" &&
        items.map((flag) => (
          <View key={flag.id} style={styles.card}>
            <View style={styles.headerRow}>
              <View style={styles.countBadge}>
                <MaterialIcons name="flag" size={12} color="#fff" />
                <Text style={styles.countText}>{flag.count}</Text>
              </View>
              <Text style={styles.reason}>{t.moderation.reasons[flag.reason]}</Text>
              <Text style={styles.when}>{timeAgo(flag.firstFlaggedAt)}</Text>
            </View>

            <View style={styles.kindRow}>
              <Text style={styles.kind}>
                {flag.targetType === "incident" ? t.moderation.onIncident : t.moderation.onMessage}
              </Text>
              {/* Absent quand le contenu a disparu : un bouton qui ne mène nulle
                  part vaut moins que pas de bouton. L'entrée reste close-able. */}
              {onOpenContent && flag.incidentId && (
                <TouchableOpacity
                  style={styles.open}
                  onPress={() => onOpenContent(flag.incidentId!, flag.targetType === "message")}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={t.moderation.openContent}
                >
                  <Text style={styles.openLabel}>{t.moderation.openContent}</Text>
                  <MaterialIcons name="open-in-new" size={13} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
            {/* L'extrait, pour juger sans ouvrir : c'est ce qui fait la
                différence entre une file qu'on traite et une file qu'on remet. */}
            <Text style={styles.excerpt} numberOfLines={4}>
              {flag.excerpt || t.moderation.noExcerpt}
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.keep}
                onPress={() => void decide(flag, "keep")}
                disabled={deciding === flag.id}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.keepLabel}>{t.moderation.keep}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.hide}
                onPress={() => void decide(flag, "hide")}
                disabled={deciding === flag.id}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                {deciding === flag.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.hideLabel}>{t.moderation.hide}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))}
    </ModalShell>
  );
}

const DANGER = "#e53e3e";

function makeStyles(c: ReturnType<typeof useAppColors>["colors"]) {
  return StyleSheet.create({
    center: { alignItems: "center", gap: 12, paddingVertical: 34 },
    notice: { fontSize: 13, color: c.text, opacity: 0.6, textAlign: "center", lineHeight: 19 },
    retry: {
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 14,
      backgroundColor: c.primary,
    },
    retryLabel: { fontSize: 13, fontWeight: "700", color: "#fff" },

    card: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.chipBorder,
      backgroundColor: c.white,
      padding: 13,
      marginBottom: 10,
      gap: 6,
    },
    headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    countBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: DANGER,
    },
    countText: { fontSize: 11, fontWeight: "800", color: "#fff" },
    reason: { flex: 1, fontSize: 12.5, fontWeight: "700", color: c.text },
    when: { fontSize: 11, color: c.text, opacity: 0.4 },
    kindRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    kind: {
      flex: 1,
      fontSize: 10.5,
      fontWeight: "800",
      letterSpacing: 0.5,
      textTransform: "uppercase",
      color: c.text,
      opacity: 0.4,
    },
    open: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 3, paddingLeft: 6 },
    openLabel: { fontSize: 12, fontWeight: "700", color: c.primary },
    excerpt: { fontSize: 13, color: c.text, opacity: 0.8, lineHeight: 18, fontStyle: "italic" },
    actions: { flexDirection: "row", gap: 8, marginTop: 6 },
    keep: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 11,
      borderRadius: 12,
      backgroundColor: c.chipBg,
      borderWidth: 1,
      borderColor: c.chipBorder,
    },
    keepLabel: { fontSize: 13, fontWeight: "700", color: c.text, opacity: 0.8 },
    hide: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 11,
      borderRadius: 12,
      backgroundColor: DANGER,
      minHeight: 41,
    },
    hideLabel: { fontSize: 13, fontWeight: "700", color: "#fff" },
  });
}
