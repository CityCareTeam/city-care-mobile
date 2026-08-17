import { ModalShell } from "@/components/ui/ModalShell";
import { CityCareColors, CityCareColorsDark } from "@/constants/theme";
import { usePreferences } from "@/context/PreferencesContext";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import { resolveLanguage, type Language } from "@/constants/i18n";
import type { SortPreference, TextScale, ThemePreference } from "@/storage/preferences";
import { clearLocalData } from "@/storage/local-reset";
import { forgetGuide } from "@/storage/onboarding";
import { exportMyData } from "@/services/data-export";
import { getValidToken } from "@/storage/tokens";
import { previewSound, warned } from "@/utils/feedback";
import { Toast } from "@/components/ui/ToastMessage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/AppText";

const DANGER = "#e53e3e";

/** Les trois ordres du fil, dans l'ordre où ils apparaissent sur l'écran. */
const SORTS: SortPreference[] = ["recent", "oldest", "nearest"];

/** Les trois crans, dans l ordre croissant. */
const TEXT_SCALES: TextScale[] = ["system", "large", "larger"];

/** Taille de l aperçu de chaque carte — elle montre ce qu elle propose. */
const TEXT_SAMPLE_SIZE: Record<TextScale, number> = { system: 13, large: 15, larger: 17 };

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
    location, setLocation,
    batterySaver, setBatterySaver,
    textScale, setTextScale,
    resetPreferences,
  } = usePreferences();
  const effective = resolveLanguage(language);
  const s = useStrings();
  const [clearing, setClearing] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  /**
   * Le guide repassera au prochain lancement.
   *
   * Pas tout de suite : cette fenêtre est ouverte par-dessus les onglets, et
   * lancer le guide par-dessus ferait trois écrans empilés. On le dit, et il
   * arrive quand l'application redémarre.
   */
  async function replayGuide() {
    await forgetGuide();
    warned();
    Toast.show({ type: "success", text1: s.settings.guideReset });
  }

  /**
   * Trois issues, trois phrases.
   *
   * « Partagé » n'est pas garanti — la personne peut refermer la feuille sans
   * rien choisir, et le système ne le dit pas. On annonce donc que le fichier
   * est prêt, ce qui est vrai dans les deux cas, plutôt qu'un envoi qu'on ne
   * peut pas confirmer.
   */
  async function runExport() {
    setExporting(true);
    try {
      const token = await getValidToken();
      if (!token) {
        Toast.show({ type: "error", text1: s.api.unauthenticated });
        return;
      }
      const outcome = await exportMyData(token);
      Toast.show({
        type: outcome === "failed" ? "error" : "success",
        text1:
          outcome === "shared"
            ? s.settings.exportReady
            : outcome === "unavailable"
              ? s.settings.exportNoTarget
              : s.settings.exportFailed,
      });
    } finally {
      setExporting(false);
    }
  }

  /**
   * Confirmée, comme tout ce qui défait un travail.
   *
   * Rien n'est perdu — ni brouillon, ni favori, ni signalement — mais reprendre
   * un thème, une langue et six interrupteurs à la main est assez pénible pour
   * qu'un appui malheureux se regrette.
   */
  function confirmReset() {
    Alert.alert(s.settings.resetSettings, s.settings.resetConfirm, [
      { text: s.alert.cancel, style: "cancel" },
      {
        text: s.settings.resetConfirmAction,
        onPress: () => {
          resetPreferences();
          warned();
          Toast.show({ type: "success", text1: s.settings.resetDone });
        },
      },
    ]);
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

      {/* ── Taille du texte ──
          Le réglage d'accessibilité d'Android s'applique déjà à toute
          l'application : « Système » ne fait donc rien de plus, et c'est le
          défaut. Les deux autres crans servent à qui veut grossir cette
          application-ci sans grossir tout son téléphone.

          Chaque carte s'affiche à la taille qu'elle propose : on voit ce qu'on
          choisit avant de choisir. */}
      <Text style={styles.label}>{s.settings.textSize}</Text>
      <View style={styles.langs}>
        {TEXT_SCALES.map((option) => {
          const active = textScale === option;
          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.langCard,
                active && { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primary + "0F" },
              ]}
              onPress={() => setTextScale(option)}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={s.settings.textSizes[option]}
            >
              {/* `allowFontScaling={false}` : l'aperçu doit montrer le rapport
                  entre les trois crans, pas subir celui qui est actif. */}
              <Text
                allowFontScaling={false}
                style={[
                  styles.langName,
                  { fontSize: TEXT_SAMPLE_SIZE[option] },
                  active && { color: colors.primary, fontWeight: "700" },
                ]}
              >
                {s.settings.textSizes[option]}
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

      {/* ── Localisation ──
          Ce n'est pas un doublon de l'autorisation Android : celle-ci se règle
          hors de l'application, une fois pour toutes. Ici on coupe l'usage sans
          y toucher — et ce que ça retire est écrit, parce qu'un réglage dont on
          ne mesure pas les conséquences ne se coupe pas de bon cœur. */}
      <Text style={styles.label}>{s.settings.location}</Text>
      <Switch
        icon="my-location"
        label={s.settings.locationUse}
        detail={s.settings.locationUseDetail}
        value={location}
        onToggle={setLocation}
        styles={styles}
        accent={colors.primary}
      />
      {!location && <Text style={styles.hint}>{s.settings.locationOffHint}</Text>}

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

      {/* ── Économie ──
          L'application redemande le fil toutes les quinze secondes. C'est ce
          qu'il faut pour qu'un signalement apparaisse pendant qu'on regarde, et
          beaucoup pour un vieux téléphone ou un forfait compté. Le réglage
          espace sans rien couper : on voit les mêmes choses, un peu plus tard. */}
      <Text style={styles.label}>{s.settings.battery}</Text>
      <Switch
        icon="battery-saver"
        label={s.settings.batterySaver}
        detail={s.settings.batterySaverDetail}
        value={batterySaver}
        onToggle={setBatterySaver}
        styles={styles}
        accent={colors.primary}
      />

      <View style={styles.divider} />

      {/* ── Guide ──
          Le revoir n'exigeait rien de moins que d'effacer toutes les données
          locales — donc de perdre brouillons et favoris pour relire trois
          écrans. */}
      <Text style={styles.label}>{s.guide.title}</Text>
      <Text style={[styles.hint, { marginBottom: 12 }]}>{s.settings.replayGuideDetail}</Text>
      <TouchableOpacity
        style={styles.secondary}
        onPress={() => void replayGuide()}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        <MaterialIcons name="school" size={17} color={colors.primary} />
        <Text style={styles.secondaryLabel}>{s.settings.replayGuide}</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* ── Mes données ──
          Le pendant de la suppression de compte : pouvoir tout effacer sans
          pouvoir rien consulter laissait le choix entre l'ignorance et la table
          rase. Le fichier part vers l'application qu'on veut — courriel, disque,
          messagerie — l'application n'en garde pas de copie. */}
      <Text style={styles.label}>{s.settings.myData}</Text>
      <Text style={[styles.hint, { marginBottom: 12 }]}>{s.settings.exportDetail}</Text>
      <TouchableOpacity
        style={styles.secondary}
        onPress={() => void runExport()}
        disabled={exporting}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        {exporting ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            <MaterialIcons name="download" size={17} color={colors.primary} />
            <Text style={styles.secondaryLabel}>{s.settings.exportData}</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* ── Données locales ──
          Brouillons, favoris, caches et guide vu vivent sur l'appareil, et rien
          ne permettait d'y faire le ménage. Destructif, donc confirmé — comme
          toutes les actions irréversibles de l'application. */}
      <Text style={styles.label}>{s.settings.localData}</Text>
      <Text style={[styles.hint, { marginBottom: 12 }]}>{s.settings.localDataDetail}</Text>
      {/* Remettre les réglages par défaut ne touche pas aux données : c'est la
          différence avec le bouton rouge en dessous. Un thème, une langue et une
          demi-douzaine d'interrupteurs se retrouvent d'un geste, sans perdre ses
          brouillons. */}
      <TouchableOpacity
        style={[styles.secondary, { marginBottom: 12 }]}
        onPress={confirmReset}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        <MaterialIcons name="settings-backup-restore" size={17} color={colors.primary} />
        <Text style={styles.secondaryLabel}>{s.settings.resetSettings}</Text>
      </TouchableOpacity>

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
    // Bordé et non plein : c'est une action ordinaire, pas la principale de
    // l'écran ni une destruction.
    secondary: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 13,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.primary + "59",
      minHeight: 46,
    },
    secondaryLabel: { fontSize: 14, fontWeight: "700", color: colors.primary },
  });
}
