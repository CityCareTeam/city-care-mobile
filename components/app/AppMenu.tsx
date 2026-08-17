import { AccountsModal } from "@/components/admin/AccountsModal";
import { SettingsModal } from "@/components/app/SettingsModal";
import { UpdatesModal } from "@/components/app/UpdatesModal";
import { ReleaseNotesModal } from "@/components/profile/ReleaseNotesModal";
import { AppVersion } from "@/components/ui/AppVersion";
import { useAuth } from "@/context/AuthContext";
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
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "@/components/ui/AppText";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Panel = "notes" | "updates" | "settings" | "accounts";
type Entry = Panel | "guide" | "privacy" | "terms";

const WIDTH = Math.min(330, Dimensions.get("window").width * 0.84);

/** Violet de l administration, distinct de l accent de l application. */
const ADMIN_ACCENT = "#AF52DE";

/** Au-delà, on considère que le geste voulait fermer et non hésiter. */
const CLOSE_THRESHOLD = WIDTH * 0.35;

const ICONS: Record<Entry, React.ComponentProps<typeof MaterialIcons>["name"]> = {
  guide: "school",
  notes: "history",
  updates: "system-update",
  settings: "tune",
  privacy: "privacy-tip",
  terms: "gavel",
  accounts: "manage-accounts",
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
export function AppMenu({
  visible,
  onClose,
  onOpenGuide,
  onOpenLegal,
}: {
  visible: boolean;
  onClose: () => void;
  onOpenGuide: () => void;
  onOpenLegal: (document: "privacy" | "terms") => void;
}) {
  const { colors, isDark } = useAppColors();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const insets = useSafeAreaInsets();
  const { logout, isAuthenticated, isAdmin } = useAuth();
  const [panel, setPanel] = useState<Panel | null>(null);
  const { ready: updateReady } = useAppUpdate();
  const t = useStrings();

  const entries: { key: Entry; label: string; detail: string }[] = [
    // Le guide d'abord : c'est l'entrée qu'on vient chercher quand on ne sait
    // pas encore ce que les autres veulent dire.
    { key: "guide", label: t.guide.title, detail: t.guide.menuDetail },
    { key: "notes", label: t.menu.releaseNotes, detail: t.menu.releaseNotesDetail },
    { key: "updates", label: t.menu.updates, detail: t.menu.updatesDetail },
    { key: "settings", label: t.menu.settings, detail: t.menu.settingsDetail },
    // Les deux documents en dernier, mais présents : ils doivent rester
    // consultables après acceptation, et pas seulement au moment de s'inscrire.
    { key: "privacy", label: t.privacy.title, detail: t.privacy.menuDetail },
    { key: "terms", label: t.terms.title, detail: t.terms.menuDetail },
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

  function open(next: Entry) {
    // On referme d'abord : deux fenêtres superposées se gênent sur Android.
    onClose();
    // Le guide et la confidentialité n'appartiennent pas au panneau : ils sont
    // montés au-dessus des onglets, parce qu'ils doivent aussi pouvoir s'ouvrir
    // seuls — le guide au premier lancement, la politique depuis la fenêtre de
    // consentement.
    if (next === "guide") onOpenGuide();
    else if (next === "privacy" || next === "terms") onOpenLegal(next);
    else setPanel(next);
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

          {/* Une section à part, et non une entrée de plus dans la liste : ce qui
              précède parle de l'application à qui l'utilise, ceci parle des
              autres comptes. Les mélanger aurait rangé « nommer un agent » entre
              « notes de version » et « conditions d'utilisation ». */}
          {isAdmin && (
            <View style={styles.adminBlock}>
              <Text style={styles.sectionLabel}>{t.menu.adminSection}</Text>
              <TouchableOpacity
                style={[styles.entry, styles.adminEntry]}
                onPress={() => open("accounts")}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t.admin.title}
              >
                <View style={[styles.entryIcon, { backgroundColor: ADMIN_ACCENT + "1F" }]}>
                  <MaterialIcons name={ICONS.accounts} size={19} color={ADMIN_ACCENT} />
                </View>
                <View style={styles.entryText}>
                  <Text style={styles.entryLabel}>{t.admin.title}</Text>
                  <Text style={styles.entryDetail}>{t.admin.subtitle}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.text + "40"} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.footer}>
            {/* La même sortie que dans le profil, au même endroit qu'on la
                cherche : en bas du panneau. La dupliquer n'est pas une entorse au
                partage « le panneau parle de l'application, le profil du compte »
                — se déconnecter est le seul geste de compte qu'on veut atteindre
                sans traverser un onglet. */}
            {isAuthenticated && (
              <TouchableOpacity
                style={styles.signOut}
                onPress={() => {
                  onClose();
                  void logout();
                }}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={t.profile.signOut}
              >
                <MaterialIcons name="logout" size={17} color={colors.primary} />
                <Text style={styles.signOutLabel}>{t.profile.signOut}</Text>
              </TouchableOpacity>
            )}
            <AppVersion />
          </View>
        </Animated.View>
      </Modal>

      <ReleaseNotesModal visible={panel === "notes"} onClose={() => setPanel(null)} />
      <UpdatesModal visible={panel === "updates"} onClose={() => setPanel(null)} />
      <SettingsModal visible={panel === "settings"} onClose={() => setPanel(null)} />
      <AccountsModal visible={panel === "accounts"} onClose={() => setPanel(null)} />
    </>
  );
}

/** Largeur de la bordure sensible, en points. Celle d'un tiroir Android. */
const EDGE_WIDTH = 30;

/** Course horizontale à franchir avant que le geste prenne la main. */
const ACTIVATE_DX = 18;

/** Écart vertical au-delà duquel on rend la main au défilement. */
const CANCEL_DY = 18;

/**
 * Ouvre le menu au glissé vers la gauche, depuis le bord droit — sur tous les
 * écrans à onglets.
 *
 * Deux tentatives avant celle-ci, et chacune a appris quelque chose :
 *
 *   1. Une bande invisible posée par-dessus l'écran (`PanResponder`) : elle
 *      ouvrait bien le menu, mais rendait ses vingt-deux pixels sourds au
 *      défilement. Un calque qui reçoit un toucher ne le rend pas à ce qu'il y a
 *      dessous.
 *   2. Un geste `react-native-gesture-handler` couvrant l'écran, activé sur tout
 *      mouvement franchement horizontal. Parfait sur une liste — mais posé sur
 *      la carte, il aurait volé le déplacement horizontal, c'est-à-dire le geste
 *      principal de l'écran.
 *
 * D'où l'activation manuelle : on décide nous-mêmes, doigt posé, si ce geste
 * nous revient. Hors de la bordure droite, on **abandonne immédiatement** et la
 * carte ou la liste reçoit le toucher comme si nous n'existions pas. C'est ce
 * qui permet de l'installer partout sans rien casser.
 *
 * ⚠️ Les rappels de toucher restent des *worklets*, sur le fil UI. Une première
 * version les avait renvoyés au fil JS (`runOnJS(true)`) pour pouvoir appeler
 * `onOpen` directement : le geste ne s'ouvrait alors nulle part. Le gestionnaire
 * d'état d'un geste se pilote depuis le fil UI ; `activate()` et `fail()`
 * appelés depuis le JS arrivent trop tard pour décider de quoi que ce soit.
 * Seule l'ouverture repasse côté JS, une fois le geste terminé.
 */
export function MenuSwipeArea({
  onOpen,
  children,
}: {
  onOpen: () => void;
  children: React.ReactNode;
}) {
  const width = Dimensions.get("window").width;
  // Des valeurs partagées et non des références : un worklet ne sait pas lire
  // le `.current` d'un `useRef`.
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .manualActivation(true)
        .onTouchesDown((event, state) => {
          "worklet";
          const touch = event.allTouches[0];
          if (!touch) return;
          startX.value = touch.absoluteX;
          startY.value = touch.absoluteY;
          // Le doigt n'est pas au bord : ce geste ne nous regarde pas.
          if (touch.absoluteX < width - EDGE_WIDTH) state.fail();
        })
        .onTouchesMove((event, state) => {
          "worklet";
          const touch = event.allTouches[0];
          if (!touch) return;
          const dx = touch.absoluteX - startX.value;
          const dy = touch.absoluteY - startY.value;

          if (Math.abs(dy) > CANCEL_DY && Math.abs(dy) > Math.abs(dx)) state.fail();
          else if (dx < -ACTIVATE_DX) state.activate();
        })
        .onEnd((event) => {
          "worklet";
          if (event.translationX < -40 || event.velocityX < -600) runOnJS(onOpen)();
        }),
    [onOpen, width, startX, startY],
  );

  // `collapsable={false}` n'est pas décoratif : React Native supprime les vues
  // qui ne portent ni style ni gestionnaire, et `GestureDetector` se retrouve
  // alors sans vue à laquelle rattacher son geste — il le dit en avertissement,
  // puis se comporte de travers. La vue conservée est celle qui reçoit le
  // toucher pour toute la zone des onglets.
  return (
    <GestureDetector gesture={pan}>
      <View style={styles.swipeArea} collapsable={false}>
        {children}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  // Le conteneur enveloppe le navigateur d'onglets : il doit occuper la place
  // que celui-ci occupait, ni plus ni moins.
  swipeArea: { flex: 1 },
});

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
    adminBlock: { marginTop: 18, gap: 8, paddingLeft: 6 },
    sectionLabel: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1,
      textTransform: "uppercase",
      color: ADMIN_ACCENT,
      paddingLeft: 2,
    },
    // Bordée de violet : la section se distingue sans changer de forme.
    adminEntry: { borderColor: ADMIN_ACCENT + "40" },
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
    footer: { marginTop: "auto", paddingLeft: 6, gap: 12 },
    // Bordé et non plein : c'est une sortie, pas l'action principale du panneau.
    signOut: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 13,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.primary + "59",
      marginRight: 6,
    },
    signOutLabel: { fontSize: 14, fontWeight: "700", color: colors.primary },
  });
}
