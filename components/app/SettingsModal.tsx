import { GlassPillSelector } from "@/components/ui/GlassPillSelector";
import { ModalShell } from "@/components/ui/ModalShell";
import { usePreferences } from "@/context/PreferencesContext";
import { useAppColors } from "@/hooks/use-app-colors";
import type { ThemePreference } from "@/storage/preferences";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: "Système", value: "system" },
  { label: "Clair", value: "light" },
  { label: "Sombre", value: "dark" },
];

/**
 * Réglages de l'application — ceux qui décrivent *cet appareil*, et non le
 * compte. Le profil garde tout ce qui suit l'utilisateur d'un téléphone à
 * l'autre : identité, mot de passe, préférences de notification.
 */
export function SettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useAppColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { theme, setTheme } = usePreferences();

  return (
    <ModalShell visible={visible} title="Réglages" onClose={onClose}>
      <Text style={styles.label}>Thème</Text>
      <GlassPillSelector
        options={THEME_OPTIONS}
        activeValue={theme}
        onSelect={setTheme}
        style={{ marginBottom: 8 }}
      />
      <Text style={styles.hint}>
        {theme === "system"
          ? "L’application suit le réglage de votre téléphone."
          : "Choix fixé pour cet appareil, quel que soit le réglage du téléphone."}
      </Text>

      <View style={styles.divider} />

      <Text style={styles.label}>Langue</Text>
      <Text style={styles.hint}>
        Français uniquement pour l’instant. Le choix de la langue arrivera avec la
        traduction de l’application.
      </Text>
    </ModalShell>
  );
}

function makeStyles(colors: ReturnType<typeof useAppColors>["colors"]) {
  return StyleSheet.create({
    label: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 10,
    },
    hint: { fontSize: 12, color: colors.text, opacity: 0.55, lineHeight: 17 },
    divider: {
      height: 1,
      backgroundColor: colors.chipBorder,
      marginVertical: 20,
    },
  });
}
