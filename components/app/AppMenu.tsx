import { SettingsModal } from "@/components/app/SettingsModal";
import { UpdatesModal } from "@/components/app/UpdatesModal";
import { ReleaseNotesModal } from "@/components/profile/ReleaseNotesModal";
import { AppVersion } from "@/components/ui/AppVersion";
import { useAppColors } from "@/hooks/use-app-colors";
import { useAppUpdate } from "@/hooks/use-app-update";
import { useStrings } from "@/hooks/use-strings";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Panel = "notes" | "updates" | "settings";

const WIDTH = Math.min(330, Dimensions.get("window").width * 0.84);

/** Au-delà, on considère que le geste voulait fermer et non hésiter. */
const CLOSE_THRESHOLD = WIDTH * 0.35;

const ICONS: Record<Panel, React.ComponentProps<typeof MaterialIcons>["name"]> = {
  notes: "history",
  updates: "system-update",
  settings: "tune",
};

/**
 * Menu latéral de l'application.
 *
 * Il rassemble ce qui parle de l'application elle-même, quand la barre du bas
 * parle de ce qu'on y fait — et le profil, qui décrit le compte, y reste.
 *
 * Il s'ouvre **par la droite** : c'est le côté du pouce, et la gauche est déjà
 * celle du retour arrière sur Android. Le glissé depuis le bord est géré par
 * `MenuEdge`, posé sur l'écran d'accueil.
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
  const t = useStrings();

  const entries: { key: Panel; label: string; detail: string }[] = [
    { key: "notes", label: t.menu.releaseNotes, detail: t.menu.releaseNotesDetail },
    { key: "updates", label: t.menu.updates, detail: t.menu.updatesDetail },
    { key: "settings", label: t.menu.settings, detail: t.menu.settingsDetail },
  ];

  // `0` panneau ouvert, `WIDTH` panneau sorti de l'écran par la droite. Le geste
  // écrit directement dans cette valeur, l'animation aussi : une seule source.
  const offset = useRef(new Animated.Value(WIDTH)).current;

  useEffect(() => {
    Animated.spring(offset, {
      toValue: visible ? 0 : WIDTH,
      useNativeDriver: true,
      // Un panneau ne rebondit pas : il glisse et s'arrête.
      bounciness: 0,
      speed: 14,
    }).start();
  }, [visible, offset]);

  // Glissé vers la droite pour refermer. Le panneau suit le doigt, et ne se
  // referme que si le geste est allé assez loin ou assez vite — sinon il revient,
  // ce qui rend l'hésitation gratuite.
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: (_, gesture) => {
          if (gesture.dx > 0) offset.setValue(gesture.dx);
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > CLOSE_THRESHOLD || gesture.vx > 0.5) onClose();
          else Animated.spring(offset, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 14 }).start();
        },
      }),
    [offset, onClose],
  );

  function open(next: Panel) {
    // On referme d'abord : deux fenêtres superposées se gênent sur Android.
    onClose();
    setPanel(next);
  }

  const fade = offset.interpolate({
    inputRange: [0, WIDTH],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <>
      <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
        <Animated.View style={[styles.backdrop, { opacity: fade }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t.menu.close}
          />
        </Animated.View>

        <Animated.View
          {...pan.panHandlers}
          style={[
            styles.panel,
            {
              paddingTop: insets.top + 18,
              paddingBottom: insets.bottom + 14,
              transform: [{ translateX: offset }],
            },
          ]}
        >
          {/* La poignée dit que ça se tire, sans avoir à l'écrire. */}
          <View style={styles.grip} />

          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>{t.menu.eyebrow}</Text>
              <Text style={styles.title}>City Care +</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t.menu.close}
            >
              <MaterialIcons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.entries}>
            {entries.map((entry) => (
              <TouchableOpacity
                key={entry.key}
                style={styles.entry}
                onPress={() => open(entry.key)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={entry.label}
              >
                <View style={[styles.entryIcon, { backgroundColor: colors.primary + "1F" }]}>
                  <MaterialIcons name={ICONS[entry.key]} size={19} color={colors.primary} />
                </View>
                <View style={styles.entryText}>
                  <Text style={styles.entryLabel}>{entry.label}</Text>
                  <Text style={styles.entryDetail}>{entry.detail}</Text>
                </View>
                {/* Une mise à jour prête se signale ici aussi : la bannière ne
                    passe qu'une fois, le menu, lui, reste. */}
                {entry.key === "updates" && updateReady && <View style={styles.dot} />}
                <MaterialIcons name="chevron-right" size={20} color={colors.text + "40"} />
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

/** Le geste doit partir de cette part droite de l'écran — la zone du pouce. */
const EDGE_RATIO = 0.6;

/**
 * Ouvre le menu au glissé vers la gauche, depuis le bord droit.
 *
 * Première tentative : une bande invisible posée par-dessus l'écran, avec un
 * `PanResponder`. Elle marchait, mais rendait ses vingt-deux pixels sourds au
 * défilement — une bande de contenu qu'on ne pouvait plus faire glisser. Un
 * calque qui reçoit un toucher ne le rend pas à ce qu'il y a dessous.
 *
 * `react-native-gesture-handler` est fait pour ça : le geste enveloppe l'écran
 * entier, ne s'active qu'après un mouvement franchement horizontal
 * (`activeOffsetX`), et **abandonne** dès que le doigt part à la verticale
 * (`failOffsetY`) — le défilement reprend alors la main partout, y compris au
 * bord.
 */
export function MenuSwipeArea({
  onOpen,
  children,
}: {
  onOpen: () => void;
  children: React.ReactNode;
}) {
  const width = Dimensions.get("window").width;
  const startX = useRef(0);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        // Les rappels touchent à l'état React : ils doivent rester sur le fil JS.
        .runOnJS(true)
        .activeOffsetX([-25, 25])
        .failOffsetY([-14, 14])
        .onBegin((event) => {
          startX.current = event.absoluteX;
        })
        .onEnd((event) => {
          if (startX.current < width * EDGE_RATIO) return;
          if (event.translationX < -50 || event.velocityX < -600) onOpen();
        }),
    [onOpen, width],
  );

  return <GestureDetector gesture={pan}>{children}</GestureDetector>;
}

function makeStyles(colors: ReturnType<typeof useAppColors>["colors"], isDark: boolean) {
  return StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
    panel: {
      position: "absolute",
      top: 0,
      bottom: 0,
      right: 0,
      width: WIDTH,
      backgroundColor: colors.background,
      paddingHorizontal: 18,
      borderTopLeftRadius: 24,
      borderBottomLeftRadius: 24,
      shadowColor: "#000",
      shadowOffset: { width: -4, height: 0 },
      shadowOpacity: isDark ? 0.5 : 0.15,
      shadowRadius: 18,
      elevation: 16,
    },
    grip: {
      position: "absolute",
      left: 7,
      top: "50%",
      width: 4,
      height: 44,
      borderRadius: 2,
      backgroundColor: colors.text,
      opacity: 0.12,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
      paddingLeft: 6,
    },
    eyebrow: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
      color: colors.primary,
      marginBottom: 2,
    },
    title: { fontSize: 20, fontWeight: "800", color: colors.text },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
    },
    entries: { gap: 10, paddingLeft: 6 },
    entry: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 13,
      borderRadius: 16,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.chipBorder,
    },
    entryIcon: {
      width: 38,
      height: 38,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
    },
    entryText: { flex: 1 },
    entryLabel: { fontSize: 14.5, fontWeight: "600", color: colors.text },
    entryDetail: { fontSize: 11, color: colors.text, opacity: 0.45, marginTop: 2 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
    footer: { marginTop: "auto", paddingLeft: 6 },
  });
}
