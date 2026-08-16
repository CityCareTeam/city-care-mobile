import { ModalShell } from "@/components/ui/ModalShell";
import { CityCareColors, CityCareColorsDark } from "@/constants/theme";
import { usePreferences } from "@/context/PreferencesContext";
import { useAppColors } from "@/hooks/use-app-colors";
import type { ThemePreference } from "@/storage/preferences";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "Système" },
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
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
      <View style={styles.themes}>
        {THEMES.map((option) => (
          <ThemeCard
            key={option.value}
            value={option.value}
            label={option.label}
            active={theme === option.value}
            onPress={() => setTheme(option.value)}
            styles={styles}
            accent={colors.primary}
          />
        ))}
      </View>
      <Text style={styles.hint}>
        {theme === "system"
          ? "L’application suit le réglage de votre téléphone."
          : "Choix fixé pour cet appareil, quel que soit le réglage du téléphone."}
      </Text>

      <View style={styles.divider} />

      <Text style={styles.label}>Langue</Text>
      <View style={styles.langRow}>
        <View style={styles.langCurrent}>
          <Text style={styles.langFlag}>🇫🇷</Text>
          <Text style={styles.langName}>Français</Text>
        </View>
        <View style={styles.langSoon}>
          <Text style={styles.langSoonText}>Anglais bientôt</Text>
        </View>
      </View>
      <Text style={styles.hint}>
        Le choix de la langue s’activera quand l’application sera traduite.
      </Text>
    </ModalShell>
  );
}

/**
 * Un thème se choisit à l'œil. Trois pastilles nommées demandaient d'imaginer le
 * résultat ; l'aperçu le montre — fond, carte et couleur d'accent, dans les
 * teintes réelles de la charte. « Système » est coupé en deux, parce que c'est
 * exactement ce qu'il promet : l'un ou l'autre selon le téléphone.
 */
function ThemeCard({
  value,
  label,
  active,
  onPress,
  accent,
  styles,
}: {
  value: ThemePreference;
  label: string;
  active: boolean;
  onPress: () => void;
  accent: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  const light = CityCareColors;
  const dark = CityCareColorsDark;

  return (
    <TouchableOpacity
      style={[styles.themeCard, active && { borderColor: accent, borderWidth: 2 }]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Thème ${label}`}
    >
      <View style={styles.preview}>
        {value === "system" ? (
          <>
            <View style={[styles.previewHalf, { backgroundColor: light.background }]}>
              <View style={[styles.previewCard, { backgroundColor: light.white }]} />
            </View>
            <View style={[styles.previewHalf, { backgroundColor: dark.background }]}>
              <View style={[styles.previewCard, { backgroundColor: dark.white }]} />
            </View>
          </>
        ) : (
          <View
            style={[
              styles.previewFull,
              { backgroundColor: value === "dark" ? dark.background : light.background },
            ]}
          >
            <View
              style={[
                styles.previewCard,
                { backgroundColor: value === "dark" ? dark.white : light.white },
              ]}
            />
          </View>
        )}
        <View style={[styles.previewAccent, { backgroundColor: light.primary }]} />
      </View>

      <View style={styles.themeLabelRow}>
        <Text style={[styles.themeLabel, active && { color: accent, fontWeight: "700" }]}>
          {label}
        </Text>
        {active && <MaterialIcons name="check-circle" size={14} color={accent} />}
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(colors: ReturnType<typeof useAppColors>["colors"]) {
  return StyleSheet.create({
    label: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 12,
    },
    hint: { fontSize: 12, color: colors.text, opacity: 0.55, lineHeight: 17 },

    // ── Thème ──
    themes: { flexDirection: "row", gap: 10, marginBottom: 12 },
    themeCard: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.chipBorder,
      backgroundColor: colors.white,
      padding: 7,
      gap: 7,
    },
    preview: {
      height: 54,
      borderRadius: 9,
      overflow: "hidden",
      flexDirection: "row",
    },
    previewHalf: { flex: 1, padding: 6, justifyContent: "flex-end" },
    previewFull: { flex: 1, padding: 6, justifyContent: "flex-end" },
    previewCard: { height: 18, borderRadius: 4 },
    previewAccent: {
      position: "absolute",
      top: 7,
      left: 7,
      width: 14,
      height: 5,
      borderRadius: 3,
    },
    themeLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
    themeLabel: { fontSize: 12, fontWeight: "600", color: colors.text },

    divider: {
      height: 1,
      backgroundColor: colors.chipBorder,
      marginVertical: 22,
    },

    // ── Langue ──
    langRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.chipBorder,
      backgroundColor: colors.white,
      marginBottom: 10,
    },
    langCurrent: { flexDirection: "row", alignItems: "center", gap: 9 },
    langFlag: { fontSize: 18 },
    langName: { fontSize: 14, fontWeight: "600", color: colors.text },
    langSoon: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 10,
      backgroundColor: colors.chipBg,
    },
    langSoonText: { fontSize: 11, fontWeight: "600", color: colors.text, opacity: 0.5 },
  });
}
