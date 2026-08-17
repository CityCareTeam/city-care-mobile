import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo } from "react";
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Consentement à la localisation, posé une fois.
 *
 * Ce n'est pas un doublon de la fenêtre d'Android. Celle-ci demande une
 * autorisation technique et ne dit rien de l'usage ; celle-là dit à quoi la
 * position sert, ce qui quitte l'appareil, et permet de refuser sans que
 * l'application cesse de fonctionner. C'est cette information-là que le RGPD
 * exige avant le consentement, et le système ne la fournit pas à notre place.
 *
 * Trois principes tenus dans la mise en page :
 *
 * Rien n'est pré-choisi. Les deux boutons ont le même poids — un consentement
 * obtenu parce que l'autre bouton était gris n'est pas un consentement.
 *
 * Ce qui part est nommé. « Améliorer votre expérience » ne veut rien dire ;
 * « Open-Meteo reçoit des coordonnées approximatives » se vérifie.
 *
 * Refuser n'est pas une impasse. La liste des choses qui continuent de marcher
 * est écrite, parce que la peur de tout casser est ce qui fait accepter à
 * contrecœur.
 */
export function LocationConsentModal({
  visible,
  onDecide,
  onReadPolicy,
}: {
  visible: boolean;
  onDecide: (allow: boolean) => void;
  onReadPolicy: () => void;
}) {
  const { colors, isDark } = useAppColors();
  const t = useStrings();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      // Pas de `onRequestClose` qui ferme : le retour Android ne doit pas valoir
      // réponse. La question se tranche par un des deux boutons.
      onRequestClose={() => {}}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { marginBottom: insets.bottom + 24 }]}>
          <View style={styles.bubble}>
            <MaterialIcons name="my-location" size={30} color={colors.primary} />
          </View>

          <Text style={styles.title}>{t.consent.title}</Text>
          <Text style={styles.intro}>{t.consent.intro}</Text>

          <ScrollView style={styles.list} contentContainerStyle={styles.listInner}>
            {t.consent.uses.map((use) => (
              <View key={use} style={styles.useRow}>
                <MaterialIcons name="check" size={15} color={colors.primary} />
                <Text style={styles.useText}>{use}</Text>
              </View>
            ))}

            <Text style={styles.leaves}>{t.consent.leaves}</Text>
            <Text style={styles.refuse}>{t.consent.refuse}</Text>
          </ScrollView>

          <TouchableOpacity onPress={onReadPolicy} style={styles.policy} accessibilityRole="link">
            <MaterialIcons name="description" size={14} color={colors.primary} />
            <Text style={styles.policyLabel}>{t.consent.readPolicy}</Text>
          </TouchableOpacity>

          {/* Même taille, même forme : seule la couleur distingue, et elle ne
              hiérarchise pas — elle dit lequel est l'accord. */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.deny}
              onPress={() => onDecide(false)}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.denyLabel}>{t.consent.deny}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.allow}
              onPress={() => onDecide(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.allowLabel}>{t.consent.allow}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.later}>{t.consent.changeLater}</Text>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(c: ReturnType<typeof useAppColors>["colors"], isDark: boolean) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
      paddingHorizontal: 20,
    },
    card: {
      backgroundColor: c.white,
      borderRadius: 26,
      padding: 22,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.5 : 0.18,
      shadowRadius: 24,
      elevation: 10,
    },
    bubble: {
      width: 68,
      height: 68,
      borderRadius: 24,
      backgroundColor: c.primary + "1F",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    title: {
      fontSize: 19,
      fontWeight: "800",
      color: c.text,
      textAlign: "center",
      letterSpacing: -0.3,
      marginBottom: 8,
    },
    intro: { fontSize: 13.5, color: c.text, opacity: 0.65, textAlign: "center", lineHeight: 19 },

    // Bornée en hauteur : la liste peut s'allonger avec les usages, la fenêtre
    // ne doit pas pour autant chasser ses boutons hors de l'écran.
    list: { alignSelf: "stretch", maxHeight: 220, marginTop: 16 },
    listInner: { gap: 9, paddingBottom: 4 },
    useRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
    useText: { flex: 1, fontSize: 13, color: c.text, opacity: 0.8, lineHeight: 18 },
    leaves: { fontSize: 12, color: c.text, opacity: 0.55, lineHeight: 17, marginTop: 6 },
    refuse: { fontSize: 12, color: c.text, opacity: 0.55, lineHeight: 17 },

    policy: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 14 },
    policyLabel: { fontSize: 12.5, fontWeight: "700", color: c.primary },

    actions: { flexDirection: "row", gap: 10, alignSelf: "stretch" },
    deny: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: c.chipBg,
      borderWidth: 1,
      borderColor: c.chipBorder,
    },
    denyLabel: { fontSize: 14, fontWeight: "700", color: c.text, opacity: 0.8 },
    allow: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: c.primary,
    },
    allowLabel: { fontSize: 14, fontWeight: "700", color: "#fff" },
    later: { fontSize: 11.5, color: c.text, opacity: 0.4, textAlign: "center", marginTop: 12 },
  });
}
