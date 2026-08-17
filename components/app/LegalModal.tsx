import { ModalShell } from "@/components/ui/ModalShell";
import { resolveLanguage } from "@/constants/i18n";
import { PRIVACY_UPDATED, privacySections } from "@/constants/privacy";
import { TERMS_UPDATED, termsSections } from "@/constants/terms";
import { usePreferences } from "@/context/PreferencesContext";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/AppText";

/** Les deux documents que l'application doit tenir à disposition. */
export type LegalDocument = "privacy" | "terms";

/**
 * Politique de confidentialité et conditions d'utilisation.
 *
 * Un seul écran pour les deux : ils ont la même forme — des sections titrées, une
 * date de révision — et deux composants jumeaux auraient divergé au premier
 * ajustement de mise en page.
 *
 * Ils vivent dans l'application et non derrière un lien : un document qu'on ne
 * peut lire qu'en ligne n'est pas lisible sur le terrain, et c'est précisément là
 * qu'on décide d'autoriser sa position ou de créer un compte.
 *
 * Atteignables avant l'inscription, et pas seulement après : l'information doit
 * précéder l'engagement.
 */
export function LegalModal({
  visible,
  document,
  onClose,
}: {
  visible: boolean;
  document: LegalDocument;
  onClose: () => void;
}) {
  const { colors } = useAppColors();
  const { language } = usePreferences();
  const t = useStrings();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const language_ = resolveLanguage(language);
  const isPrivacy = document === "privacy";
  const sections = isPrivacy ? privacySections(language_) : termsSections(language_);
  const updated = isPrivacy ? PRIVACY_UPDATED : TERMS_UPDATED;

  return (
    <ModalShell visible={visible} title={isPrivacy ? t.privacy.title : t.terms.title} onClose={onClose}>
      {/* La date en tête : sans elle, on ne sait pas ce qu'on a accepté. */}
      <Text style={styles.updated}>{t.privacy.updated(updated)}</Text>

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
