import { ModalShell } from "@/components/ui/ModalShell";
import { CityCareColors, CityCareColorsDark } from "@/constants/theme";
import { usePreferences } from "@/context/PreferencesContext";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import { resolveLanguage, type Language } from "@/constants/i18n";
import { NEARBY_RADII, type SortPreference, type ThemePreference } from "@/storage/preferences";
import { formatDistance } from "@/utils/format-distance";
import { clearLocalData } from "@/storage/local-reset";
import { previewSound, warned } from "@/utils/feedback";
import { Toast } from "@/components/ui/ToastMessage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const DANGER = "#e53e3e";

/** Les trois ordres du fil, dans l'ordre où ils apparaissent sur l'écran. */
const SORTS: SortPreference[] = ["recent", "oldest", "nearest"];

/**
 * Les libellés viennent de ceux de l'accueil : le réglage doit nommer les
 * boutons exactement comme l'écran qu'il commande, sinon on choisit à l'aveugle.
 */
const SORT_LABELS: Record<SortPreference, "sortRecent" | "sortOldest" | "sortNearest"> = {
  recent: "sortRecent",
  oldest: "sortOldest",
  nearest: "sortNearest",
};

/**
 * Deux langues, deux cartes — et pas de troisième pour « Système ».
 *
 * Elle existe toujours, mais comme *défaut* : tant que personne n'a choisi,
 * l'application suit le téléphone, et c'est la langue ainsi obtenue qui apparaît
 * sélectionnée. En faire une entrée visible obligeait à empiler trois lignes
 * pour un réglage binaire, et à expliquer une option que personne ne cherche.
 */
const LANGUAGES: { value: Language; label: string; flag: string }[] = [
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
  const {
    theme, setTheme,
    language, setLanguage,
    haptics, setHaptics,
    sounds, setSounds,
    defaultSort, setDefaultSort,
    nearbyAlerts, setNearbyAlerts,
    nearbyRadiusKm, setNearbyRadiusKm,
  } = usePreferences();
  const effective = resolveLanguage(language);
  const s = useStrings();
  const [clearing, setClearing] = useState(false);

  /**
   * Le son s'essaie en même temps qu'on l'active.
   *
   * Un interrupteur sonore muet est une promesse sur parole : on ne sait qu'au
   * prochain signalement s'il marche, si le volume est monté, si le son plaît.
   * L'entendre à l'instant du choix répond aux trois questions.
   */
  function toggleSounds(next: boolean) {
    setSounds(next);
    if (next) previewSound();
  }

  function confirmClear() {
    Alert.alert(s.settings.clearLocalData, s.settings.clearConfirm, [
      { text: s.alert.cancel, style: "cancel" },
      {
        text: s.settings.clearConfirmAction,
        style: "destructive",
        onPress: () => {
          setClearing(true);
          void clearLocalData()
            .then(() => {
              warned();
              Toast.show({ type: "success", text1: s.settings.cleared });
            })
            .finally(() => setClearing(false));
        },
      },
    ]);
  }

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
          // On compare à la langue *effective* : sur « système », c'est celle du
          // téléphone qui doit apparaître cochée, pas aucune des deux.
          const active = effective === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.langCard,
                active && { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primary + "0F" },
              ]}
              onPress={() => setLanguage(option.value)}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={option.label}
            >
              <Text style={styles.langFlag}>{option.flag}</Text>
              {/* Chaque langue porte son propre nom, dans sa propre langue : on
                  ne cherche pas « Anglais » quand on veut passer à l'anglais. */}
              <Text style={[styles.langName, active && { color: colors.primary, fontWeight: "700" }]}>
                {option.label}
              </Text>
              {active && <MaterialIcons name="check-circle" size={15} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.divider} />

      {/* ── Retours ──
          Vibration et son ensemble : ils répondent aux mêmes gestes et se
          règlent du même mouvement. Le son démarre éteint — une application qui
          se met à sonner sans qu'on l'ait demandé se fait couper le volume,
          pas régler. */}
      <Text style={styles.label}>{s.settings.feedback}</Text>
      <Switch
        icon="vibration"
        label={s.settings.haptics}
        detail={s.settings.hapticsDetail}
        value={haptics}
        onToggle={setHaptics}
        styles={styles}
        accent={colors.primary}
      />
      <Switch
        icon="volume-up"
        label={s.settings.sounds}
        detail={s.settings.soundsDetail}
        value={sounds}
        onToggle={toggleSounds}
        styles={styles}
        accent={colors.primary}
      />

      <View style={styles.divider} />

      {/* ── Alerte de proximité ──
          Éteinte par défaut, et le rayon ne s'affiche qu'une fois allumée : un
          réglage qui ne sert à rien tant que l'interrupteur est fermé n'a pas à
          occuper l'écran. */}
      <Text style={styles.label}>{s.settings.nearby}</Text>
      <Switch
        icon="notifications-active"
        label={s.settings.nearbyAlerts}
        detail={s.settings.nearbyAlertsDetail}
        value={nearbyAlerts}
        onToggle={setNearbyAlerts}
        styles={styles}
        accent={colors.primary}
      />
      {nearbyAlerts && (
        <>
          <View style={styles.sorts}>
            {NEARBY_RADII.map((km) => {
              const active = nearbyRadiusKm === km;
              return (
                <TouchableOpacity
                  key={km}
                  style={[styles.sortChip, active && { borderColor: colors.primary, backgroundColor: colors.primary + "14" }]}
                  onPress={() => setNearbyRadiusKm(km)}
                  activeOpacity={0.8}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.sortLabel, active && { color: colors.primary, fontWeight: "800" }]}>
                    {formatDistance(km, s.locale)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {/* La limite est dite, parce qu'elle serait autrement découverte comme
              une panne : personne ne devine qu'une alerte demande l'application
              ouverte. */}
          <Text style={styles.hint}>{s.settings.nearbyLimit}</Text>
        </>
      )}

      <View style={styles.divider} />

      {/* ── Tri par défaut ──
          « Proches » demande la position ; le choisir ici, c'est la demander
          une fois pour toutes au lieu de la redemander à chaque ouverture. */}
      <Text style={styles.label}>{s.settings.defaultSort}</Text>
      <View style={styles.sorts}>
        {SORTS.map((option) => {
          const active = defaultSort === option;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.sortChip, active && { borderColor: colors.primary, backgroundColor: colors.primary + "14" }]}
              onPress={() => setDefaultSort(option)}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.sortLabel, active && { color: colors.primary, fontWeight: "800" }]}>
                {s.home[SORT_LABELS[option]]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {defaultSort === "nearest" && <Text style={styles.hint}>{s.settings.sortNearestHint}</Text>}

      <View style={styles.divider} />

      {/* ── Données locales ──
          Brouillons, favoris, caches et guide vu vivent sur l'appareil, et rien
          ne permettait d'y faire le ménage. Destructif, donc confirmé — comme
          toutes les actions irréversibles de l'application. */}
      <Text style={styles.label}>{s.settings.localData}</Text>
      <Text style={[styles.hint, { marginBottom: 12 }]}>{s.settings.localDataDetail}</Text>
      <TouchableOpacity
        style={styles.danger}
        onPress={confirmClear}
        disabled={clearing}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        {clearing ? (
          <ActivityIndicator size="small" color={DANGER} />
        ) : (
          <>
            <MaterialIcons name="delete-sweep" size={18} color={DANGER} />
            <Text style={styles.dangerLabel}>{s.settings.clearLocalData}</Text>
          </>
        )}
      </TouchableOpacity>
    </ModalShell>
  );
}

/**
 * Un interrupteur maison plutôt que le `Switch` de React Native.
 *
 * Celui du système ignore la charte : il prend la couleur d'accent d'Android et
 * ne s'accorde ni au thème sombre de l'application ni à ses arrondis. Celui-ci
 * est un rail et une bille, dans les couleurs de la maison.
 */
function Switch({
  icon,
  label,
  detail,
  value,
  onToggle,
  styles,
  accent,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  detail: string;
  value: boolean;
  onToggle: (next: boolean) => void;
  styles: ReturnType<typeof makeStyles>;
  accent: string;
}) {
  return (
    <TouchableOpacity
      style={styles.switchRow}
      onPress={() => onToggle(!value)}
      activeOpacity={0.75}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
    >
      <MaterialIcons name={icon} size={19} color={value ? accent : styles.switchDetail.color} />
      <View style={styles.switchText}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Text style={styles.switchDetail}>{detail}</Text>
      </View>
      <View style={[styles.track, value && { backgroundColor: accent }]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </TouchableOpacity>
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
    langs: { flexDirection: "row", gap: 10 },
    langCard: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.chipBorder,
      backgroundColor: colors.white,
    },
    langFlag: { fontSize: 20 },
    langName: { fontSize: 14, fontWeight: "600", color: colors.text },

    // ── Interrupteurs ──
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 11,
    },
    switchText: { flex: 1, gap: 1 },
    switchLabel: { fontSize: 14, fontWeight: "600", color: colors.text },
    switchDetail: { fontSize: 11.5, color: colors.text + "8C" },
    track: {
      width: 44,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.chipBorder,
      padding: 3,
      justifyContent: "center",
    },
    knob: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.white,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    knobOn: { alignSelf: "flex-end" },

    // ── Tri par défaut ──
    sorts: { flexDirection: "row", gap: 8, marginBottom: 10 },
    sortChip: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 11,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.chipBorder,
      backgroundColor: colors.white,
    },
    sortLabel: { fontSize: 13, fontWeight: "600", color: colors.text },

    // ── Données locales ──
    danger: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 13,
      borderRadius: 14,
      backgroundColor: DANGER + "14",
      minHeight: 46,
    },
    dangerLabel: { fontSize: 14, fontWeight: "700", color: DANGER },
  });
}
