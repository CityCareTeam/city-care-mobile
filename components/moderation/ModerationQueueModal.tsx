import { ModalShell } from "@/components/ui/ModalShell";
import { Toast } from "@/components/ui/ToastMessage";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import {
  decideOnFlag,
  deleteHiddenContent,
  getHiddenContent,
  getModerationQueue,
  MODERATION_UNAVAILABLE,
  restoreContent,
  type FlaggedContent,
  type HiddenContent,
} from "@/services/moderation";
import { getValidToken } from "@/storage/tokens";
import { timeAgo } from "@/utils/format-date";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type State = "loading" | "ready" | "unavailable" | "failed";
type Tab = "queue" | "hidden";

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
  canDelete = false,
  onCountChange,
}: {
  visible: boolean;
  onClose: () => void;
  /** Ouvre l'incident concerné, sur son fil quand le contenu visé est un message. */
  onOpenContent?: (incidentId: string, onMessage: boolean) => void;
  /**
   * Supprimer définitivement. Faux par défaut, et réservé aux administrateurs :
   * un agent masque — geste réversible — un administrateur efface. Le serveur
   * refuse de son côté ; ceci évite d'offrir un bouton qui serait rejeté.
   */
  canDelete?: boolean;
  /** Remonte le nombre d'affaires en attente, pour la pastille de l'écran. */
  onCountChange?: (count: number) => void;
}) {
  const { colors } = useAppColors();
  const t = useStrings();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [tab, setTab] = useState<Tab>("queue");
  const [state, setState] = useState<State>("loading");
  const [items, setItems] = useState<FlaggedContent[]>([]);
  const [hidden, setHidden] = useState<HiddenContent[]>([]);
  const [deciding, setDeciding] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const token = await getValidToken();
      if (!token) throw new Error("no token");
      // Les deux listes ensemble : trancher fait passer un contenu de l'une à
      // l'autre, et les charger séparément montrerait un état incohérent le temps
      // d'un aller-retour.
      const [queue, masked] = await Promise.all([
        getModerationQueue(token),
        getHiddenContent(token),
      ]);
      // Le plus signalé d'abord, puis le plus ancien : dix personnes qui
      // signalent la même chose ont plus urgemment raison qu'une seule.
      setItems(
        [...queue].sort(
          (a, b) => b.count - a.count || a.firstFlaggedAt.localeCompare(b.firstFlaggedAt),
        ),
      );
      setHidden(masked);
      onCountChange?.(queue.length);
      setState("ready");
    } catch (e) {
      setState(
        e instanceof Error && e.message === MODERATION_UNAVAILABLE ? "unavailable" : "failed",
      );
    }
  }, [onCountChange]);

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
      setItems((current) => {
        const rest = current.filter((kept) => kept.id !== flag.id);
        onCountChange?.(rest.length);
        return rest;
      });
      // Masquer déplace le contenu vers l'autre onglet. Le recharger plutôt que
      // de le reconstituer ici : le serveur sait qui a tranché et quand, et un
      // faux enregistrement fabriqué de ce côté finirait par mentir.
      if (decision === "hide") {
        const token2 = await getValidToken();
        if (token2) setHidden(await getHiddenContent(token2));
      }
      Toast.show({ type: "success", text1: t.moderation.decided });
    } catch {
      Toast.show({ type: "error", text1: t.alert.errorTitle, text2: t.moderation.decideFailed });
    } finally {
      setDeciding(null);
    }
  }

  async function restore(item: HiddenContent) {
    setDeciding(item.targetId);
    try {
      const token = await getValidToken();
      if (!token) throw new Error("no token");
      await restoreContent(item.targetType, item.targetId, token);
      setHidden((current) => current.filter((kept) => kept.targetId !== item.targetId));
      Toast.show({ type: "success", text1: t.moderation.restored });
    } catch {
      Toast.show({ type: "error", text1: t.alert.errorTitle, text2: t.moderation.decideFailed });
    } finally {
      setDeciding(null);
    }
  }

  /**
   * La suppression demande une confirmation, contrairement au masquage.
   *
   * Ce n'est pas de la symétrie manquée : masquer s'annule dans l'onglet d'à
   * côté, effacer ne s'annule pas du tout. Le seul moment où l'on peut encore
   * changer d'avis est avant l'appui.
   */
  function confirmDelete(item: HiddenContent) {
    Alert.alert(t.moderation.deleteTitle, t.moderation.deleteMessage, [
      { text: t.alert.cancel, style: "cancel" },
      {
        text: t.moderation.deleteConfirm,
        style: "destructive",
        onPress: async () => {
          setDeciding(item.targetId);
          try {
            const token = await getValidToken();
            if (!token) throw new Error("no token");
            await deleteHiddenContent(item.targetType, item.targetId, token);
            setHidden((current) => current.filter((kept) => kept.targetId !== item.targetId));
            Toast.show({ type: "success", text1: t.moderation.deleted });
          } catch {
            Toast.show({
              type: "error",
              text1: t.alert.errorTitle,
              text2: t.moderation.deleteFailed,
            });
          } finally {
            setDeciding(null);
          }
        },
      },
    ]);
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

      {/* Deux onglets, parce que masquer déplace un contenu au lieu de le faire
          disparaître. Sans le second, une décision prise ne se revoyait plus.

          Un sélecteur à plat, et non le `GlassPillSelector` des autres écrans :
          celui-ci empile un flou, une ombre et une `elevation` pour se détacher
          d'une carte ou d'une photo. Posé sur la surface opaque d'une fenêtre, il
          n'a rien à faire flotter — et cette pile rendait un fond quadrillé sur
          Android, là où il ne devait y avoir qu'un fond. */}
      {state === "ready" && (
        <View style={styles.tabs}>
          {([
            { key: "queue" as const, label: t.moderation.tabQueue, count: items.length },
            { key: "hidden" as const, label: t.moderation.tabHidden, count: hidden.length },
          ]).map((option) => {
            const active = tab === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setTab(option.key)}
                activeOpacity={0.8}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{option.label}</Text>
                {option.count > 0 && (
                  <View style={[styles.tabCount, active && styles.tabCountActive]}>
                    <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>
                      {option.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {state === "ready" && tab === "queue" && items.length === 0 && (
        <View style={styles.center}>
          <MaterialIcons name="verified" size={28} color={colors.text + "40"} />
          <Text style={styles.notice}>{t.moderation.queueEmpty}</Text>
        </View>
      )}

      {state === "ready" && tab === "hidden" && hidden.length === 0 && (
        <View style={styles.center}>
          <MaterialIcons name="visibility" size={28} color={colors.text + "40"} />
          <Text style={styles.notice}>{t.moderation.hiddenEmpty}</Text>
        </View>
      )}

      {state === "ready" &&
        tab === "hidden" &&
        hidden.map((item) => (
          <View key={item.targetType + item.targetId} style={styles.card}>
            <View style={styles.headerRow}>
              <View style={[styles.countBadge, styles.hiddenBadge]}>
                <MaterialIcons name="visibility-off" size={12} color="#fff" />
                {item.flagCount > 0 && <Text style={styles.countText}>{item.flagCount}</Text>}
              </View>
              <Text style={styles.reason}>
                {item.reason ? t.moderation.reasons[item.reason] : t.moderation.hiddenNoReason}
              </Text>
              {item.decidedAt && <Text style={styles.when}>{timeAgo(item.decidedAt)}</Text>}
            </View>

            <View style={styles.kindRow}>
              <Text style={styles.kind}>
                {item.targetType === "incident" ? t.moderation.onIncident : t.moderation.onMessage}
              </Text>
              {onOpenContent && (
                <TouchableOpacity
                  style={styles.open}
                  onPress={() => onOpenContent(item.incidentId, item.targetType === "message")}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={t.moderation.openContent}
                >
                  <Text style={styles.openLabel}>{t.moderation.openContent}</Text>
                  <MaterialIcons name="open-in-new" size={13} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.excerpt} numberOfLines={4}>
              {item.excerpt || t.moderation.noExcerpt}
            </Text>

            {/* Qui a tranché, et pourquoi. Une modération anonyme ne se défend
                pas — et l'agent qui reprend le dossier a besoin de savoir ce que
                son collègue avait vu. */}
            {item.decidedBy && (
              <Text style={styles.decidedBy}>{t.moderation.hiddenBy(item.decidedBy)}</Text>
            )}
            {item.decisionComment && (
              <Text style={styles.comment}>« {item.decisionComment} »</Text>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.keep}
                onPress={() => void restore(item)}
                disabled={deciding === item.targetId}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                {deciding === item.targetId ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Text style={styles.keepLabel}>{t.moderation.restore}</Text>
                )}
              </TouchableOpacity>
              {canDelete && (
                <TouchableOpacity
                  style={styles.hide}
                  onPress={() => confirmDelete(item)}
                  disabled={deciding === item.targetId}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <Text style={styles.hideLabel}>{t.moderation.deleteShort}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

      {state === "ready" &&
        tab === "queue" &&
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
    // Une piste creusée dans la surface, sans ombre ni flou : la fenêtre porte
    // déjà son relief, un second en aurait fait deux.
    tabs: {
      flexDirection: "row",
      gap: 4,
      padding: 4,
      marginBottom: 14,
      borderRadius: 14,
      backgroundColor: c.chipBg,
      borderWidth: 1,
      borderColor: c.chipBorder,
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 9,
      borderRadius: 10,
    },
    tabActive: { backgroundColor: c.primary },
    tabLabel: { fontSize: 13, fontWeight: "700", color: c.text, opacity: 0.5 },
    tabLabelActive: { color: "#fff", opacity: 1 },
    tabCount: {
      minWidth: 18,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 9,
      alignItems: "center",
      backgroundColor: c.primary + "26",
    },
    tabCountActive: { backgroundColor: "rgba(255,255,255,0.28)" },
    tabCountText: { fontSize: 10.5, fontWeight: "800", color: c.primary },
    tabCountTextActive: { color: "#fff" },
    /** Gris et non rouge : le contenu est déjà traité, il n'alerte plus. */
    hiddenBadge: { backgroundColor: c.text + "66" },
    decidedBy: { fontSize: 11.5, color: c.text, opacity: 0.5 },
    comment: { fontSize: 12, color: c.text, opacity: 0.65, fontStyle: "italic", lineHeight: 17 },
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
