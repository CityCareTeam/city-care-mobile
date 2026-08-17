import { ModalShell } from "@/components/ui/ModalShell";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import { FLAG_REASONS, type FlagReason } from "@/services/moderation";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * Une icône par motif. Elles vivent ici et non dans les traductions : une icône
 * n'est pas du texte.
 */
const ICONS: Record<FlagReason, React.ComponentProps<typeof MaterialIcons>["name"]> = {
  hateful: "sentiment-very-dissatisfied",
  personal_data: "person-off",
  off_topic: "block",
  false_report: "help-outline",
  advertising: "campaign",
  other: "more-horiz",
};

/**
 * Signaler un contenu.
 *
 * Un motif est demandé, et ce n'est pas de la bureaucratie : « inapproprié »
 * n'aide pas un modérateur à trancher, et les six motifs proposés reprennent un
 * pour un les interdits des conditions d'utilisation. Une règle qu'on ne peut
 * pas invoquer ne sert à rien.
 *
 * La fenêtre dit aussi ce qui va se passer — le contenu disparaît de cet
 * appareil tout de suite — parce que sans cette phrase, on appuie sans savoir si
 * l'on dénonce ou si l'on se protège.
 */
export function FlagContentModal({
  visible,
  onClose,
  onConfirm,
  mode = "report",
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: FlagReason) => Promise<void>;
  /**
   * `report` : un citoyen alerte, et le contenu disparaît de son appareil en
   * attendant qu'on tranche. `moderate` : un agent tranche tout de suite, et le
   * contenu disparaît pour tout le monde.
   *
   * Même fenêtre parce que la question posée est la même — « qu'est-ce qu'on
   * reproche à ce contenu ? » — et que le motif sert dans les deux cas de trace.
   * Seule change la portée du geste, et elle est écrite noir sur blanc : croire
   * qu'on alerte quand on retire, ou l'inverse, serait grave.
   */
  mode?: "report" | "moderate";
}) {
  const { colors } = useAppColors();
  const t = useStrings();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [reason, setReason] = useState<FlagReason | null>(null);
  const [sending, setSending] = useState(false);

  async function confirm() {
    if (!reason) return;
    setSending(true);
    try {
      await onConfirm(reason);
      setReason(null);
    } finally {
      setSending(false);
    }
  }

  const moderating = mode === "moderate";

  return (
    <ModalShell
      visible={visible}
      title={moderating ? t.moderation.hideTitle : t.moderation.flagTitle}
      onClose={() => {
        setReason(null);
        onClose();
      }}
    >
      <Text style={styles.intro}>
        {moderating ? t.moderation.hideIntro : t.moderation.flagIntro}
      </Text>

      <View style={styles.reasons}>
        {FLAG_REASONS.map((option) => {
          const active = reason === option;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.reason, active && styles.reasonActive]}
              onPress={() => setReason(option)}
              activeOpacity={0.75}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <MaterialIcons
                name={ICONS[option]}
                size={19}
                color={active ? colors.primary : styles.reasonLabel.color}
              />
              <Text style={[styles.reasonLabel, active && styles.reasonLabelActive]}>
                {t.moderation.reasons[option]}
              </Text>
              {active && <MaterialIcons name="check" size={18} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Dit avant l'appui, pas après : on doit savoir si l'on dénonce ou si
          l'on se protège — pour un citoyen, les deux. Pour un agent, la portée
          n'est pas la même du tout, et c'est ici qu'elle s'écrit. */}
      <Text style={styles.effect}>
        {moderating ? t.moderation.hideEffect : t.moderation.flagEffect}
      </Text>

      <TouchableOpacity
        style={[styles.send, moderating && styles.sendDanger, !reason && { opacity: 0.4 }]}
        onPress={() => void confirm()}
        disabled={!reason || sending}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        {sending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.sendLabel}>
            {moderating ? t.moderation.hide : t.moderation.flagSend}
          </Text>
        )}
      </TouchableOpacity>
    </ModalShell>
  );
}

function makeStyles(c: ReturnType<typeof useAppColors>["colors"]) {
  return StyleSheet.create({
    intro: { fontSize: 13, color: c.text, opacity: 0.7, lineHeight: 18, marginBottom: 14 },
    reasons: { gap: 8 },
    reason: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      paddingVertical: 12,
      paddingHorizontal: 13,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: c.chipBorder,
      backgroundColor: c.chipBg,
    },
    reasonActive: { borderColor: c.primary, backgroundColor: c.primary + "12" },
    reasonLabel: { flex: 1, fontSize: 13.5, color: c.text, opacity: 0.85 },
    reasonLabelActive: { color: c.primary, fontWeight: "700", opacity: 1 },
    effect: {
      fontSize: 11.5,
      color: c.text,
      opacity: 0.5,
      lineHeight: 16,
      marginTop: 14,
      marginBottom: 14,
    },
    send: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: c.primary,
      minHeight: 48,
    },
    // Rouge quand le geste retire pour tout le monde : la couleur dit la portée
    // avant qu'on ait lu le libellé.
    sendDanger: { backgroundColor: "#e53e3e" },
    sendLabel: { fontSize: 14, fontWeight: "700", color: "#fff" },
  });
}
