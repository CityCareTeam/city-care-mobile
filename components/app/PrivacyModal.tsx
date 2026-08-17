import { ModalShell } from "@/components/ui/ModalShell";
import { resolveLanguage } from "@/constants/i18n";
import { PRIVACY_UPDATED, privacySections } from "@/constants/privacy";
import { usePreferences } from "@/context/PreferencesContext";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

/**
 * Politique de confidentialité.
 *
 * Elle vit dans l'application et non derrière un lien : un document qu'on ne
 * peut lire qu'en ligne n'est pas lisible sur le terrain, et c'est précisément
 * là qu'on décide d'autoriser sa position.
 *
 * Atteignable depuis deux endroits, et les deux comptent : les réglages, pour
 * qui la cherche ; l'écran de connexion, pour qui n'a pas encore de compte —
 * l'information doit précéder le consentement, pas le suivre.
 */
export function PrivacyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useAppColors();
  const { language } = usePreferences();
  const t = useStrings();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const sections = privacySections(resolveLanguage(language));

  return (
    <ModalShell visible={visible} title={t.privacy.title} onClose={onClose}>
      {/* La date en tête : sans elle, on ne sait pas ce qu'on a accepté. */}
      <Text style={styles.updated}>{t.privacy.updated(PRIVACY_UPDATED)}</Text>

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <View style={styles.headingRow}>
            <View style={styles.accent} />
            <Text style={styles.heading}>{section.title}</Text>
          </View>
          {section.body.map((paragraph) => (
            <Text key={paragraph} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      ))}
    </ModalShell>
  );
}

function makeStyles(c: ReturnType<typeof useAppColors>["colors"]) {
  return StyleSheet.create({
    updated: { fontSize: 11.5, color: c.text, opacity: 0.45, marginBottom: 18 },
    section: { marginBottom: 20, gap: 8 },
    // Le même liseré d'accent que les sections de l'accueil et des fenêtres :
    // un document long se parcourt d'abord par ses titres.
    headingRow: { flexDirection: "row", alignItems: "center", gap: 9 },
    accent: { width: 3, height: 16, borderRadius: 2, backgroundColor: c.primary },
    heading: { flex: 1, fontSize: 14.5, fontWeight: "800", color: c.text, letterSpacing: -0.2 },
    paragraph: { fontSize: 13, color: c.text, opacity: 0.75, lineHeight: 19 },
  });
}
