import { SettingsModal } from "@/components/app/SettingsModal";
import { UpdatesModal } from "@/components/app/UpdatesModal";
import { ReleaseNotesModal } from "@/components/profile/ReleaseNotesModal";
import { AppVersion } from "@/components/ui/AppVersion";
import { useAppColors } from "@/hooks/use-app-colors";
import { useAppUpdate } from "@/hooks/use-app-update";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Panel = "notes" | "updates" | "settings";

const WIDTH = Math.min(320, Dimensions.get("window").width * 0.82);

const ENTRIES: {
  key: Panel;
  label: string;
  detail: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
}[] = [
  { key: "notes", label: "Notes de version", detail: "Ce qui a changé", icon: "history" },
  { key: "updates", label: "Mises à jour", detail: "Vérifier et appliquer", icon: "system-update" },
  { key: "settings", label: "Réglages", detail: "Thème, langue", icon: "tune" },
];

/**
 * Menu latéral de l'application.
 *
 * Il rassemble ce qui parle de l'application elle-même, quand la barre du bas
 * parle de ce qu'on y fait — et le profil, qui décrit le compte, y reste.
 *
 * C'est un panneau et non un `Drawer` de navigation : les trois entrées ouvrent
 * des fenêtres, aucune n'est une destination. Passer par un vrai tiroir aurait
 * imposé de déplacer `(tabs)` sous un nouveau groupe de routes, donc de reprendre
 * chaque `router.navigate` typé — beaucoup de risque sur les chemins existants
 * pour un résultat identique à l'écran.
 */
export function AppMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, isDark } = useAppColors();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const insets = useSafeAreaInsets();
  const [panel, setPanel] = useState<Panel | null>(null);
  const { ready: updateReady } = useAppUpdate();

  // Le panneau reste monté le temps de sa sortie : le démonter à l'ouverture du
  // volet donnerait une disparition sèche.
  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: visible ? 220 : 180,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  function open(next: Panel) {
    // On referme d'abord : deux fenêtres superposées se gênent sur Android.
    onClose();
    setPanel(next);
  }

  return (
    <>
      <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: slide }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fermer le menu"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.panel,
            {
              paddingTop: insets.top + 20,
              paddingBottom: insets.bottom + 16,
              transform: [
                { translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [-WIDTH, 0] }) },
              ],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>City Care +</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Fermer le menu"
            >
              <MaterialIcons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.entries}>
            {ENTRIES.map((entry) => (
              <TouchableOpacity
                key={entry.key}
                style={styles.entry}
                onPress={() => open(entry.key)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={entry.label}
              >
                <View style={[styles.entryIcon, { backgroundColor: colors.primary + "1F" }]}>
                  <MaterialIcons name={entry.icon} size={19} color={colors.primary} />
                </View>
                <View style={styles.entryText}>
                  <Text style={styles.entryLabel}>{entry.label}</Text>
                  <Text style={styles.entryDetail}>{entry.detail}</Text>
                </View>
                {/* Une mise à jour prête se signale ici aussi : la bannière ne
                    passe qu'une fois, le menu, lui, reste. */}
                {entry.key === "updates" && updateReady && <View style={styles.dot} />}
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <AppVersion />
          </View>
        </Animated.View>
      </Modal>

      <ReleaseNotesModal visible={panel === "notes"} onClose={() => setPanel(null)} />
      <UpdatesModal visible={panel === "updates"} onClose={() => setPanel(null)} />
      <SettingsModal visible={panel === "settings"} onClose={() => setPanel(null)} />
    </>
  );
}

function makeStyles(colors: ReturnType<typeof useAppColors>["colors"], isDark: boolean) {
  return StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
    panel: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      width: WIDTH,
      backgroundColor: colors.background,
      paddingHorizontal: 18,
      borderTopRightRadius: 22,
      borderBottomRightRadius: 22,
      shadowColor: "#000",
      shadowOffset: { width: 4, height: 0 },
      shadowOpacity: isDark ? 0.5 : 0.15,
      shadowRadius: 18,
      elevation: 16,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 22,
    },
    title: { fontSize: 19, fontWeight: "800", color: colors.text },
    entries: { gap: 8 },
    entry: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 12,
      borderRadius: 14,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.chipBorder,
    },
    entryIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    entryText: { flex: 1 },
    entryLabel: { fontSize: 14, fontWeight: "600", color: colors.text },
    entryDetail: { fontSize: 11, color: colors.text, opacity: 0.45, marginTop: 1 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
    chevron: { fontSize: 20, color: colors.text, opacity: 0.25 },
    footer: { marginTop: "auto" },
  });
}
