import { ModalShell } from "@/components/ui/ModalShell";
import { CityCareColors, CityCareColorsDark } from "@/constants/theme";
import { usePreferences } from "@/context/PreferencesContext";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import type { LanguagePreference } from "@/constants/i18n";
import type { ThemePreference } from "@/storage/preferences";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const LANGUAGES: { value: LanguagePreference; label: string; flag: string }[] = [
  { value: "system", label: "", flag: "🌐" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
  { value: "en", label: "English", flag: "🇬🇧" },
];

/**
 * Réglages de l'application — ceux qui décrivent *cet appareil*, et non le
 * compte. Le profil garde tout ce qui suit l'utilisateur d'un téléphone à
 * l'autre : identité, mot de passe, préférences de notification.
 */
export function SettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useAppColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { theme, setTheme, language, setLanguage } = usePreferences();
  const s = useStrings();

  const themes: { value: ThemePreference; label: string }[] = [
    { value: "system", label: s.settings.themeSystem },
    { value: "light", label: s.settings.themeLight },
    { value: "dark", label: s.settings.themeDark },
  ];

  return (
    <ModalShell visible={visible} title={s.settings.title} onClose={onClose}>
      <Text style={styles.label}>{s.settings.theme}</Text>
      <View style={styles.themes}>
        {themes.map((option) => (
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
        {theme === "system" ? s.settings.themeFollowsDevice : s.settings.themeFixed}
      </Text>

      <View style={styles.divider} />

      <Text style={styles.label}>{s.settings.language}</Text>
      <View style={styles.langs}>
        {LANGUAGES.map((option) => {
          const active = language === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.langCard, active && { borderColor: colors.primary, borderWidth: 2 }]}
              onPress={() => setLanguage(option.value)}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={option.label || s.settings.languageSystem}
            >
              <Text style={styles.langFlag}>{option.flag}</Text>
              <Text style={[styles.langName, active && { color: colors.primary, fontWeight: "700" }]}>
                {/* Le libellé « Système » est le seul à se traduire : les deux
                    autres portent leur propre nom, dans leur propre langue. */}
                {option.label || s.settings.languageSystem}
              </Text>
              {active && <MaterialIcons name="check-circle" size={14} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.hint}>
        {language === "system" ? s.settings.languageFollowsDevice : s.settings.languageFixed}
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
    langs: { gap: 8, marginBottom: 12 },
    langCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.chipBorder,
      backgroundColor: colors.white,
    },
    langFlag: { fontSize: 18 },
    langName: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.text },
  });
}
