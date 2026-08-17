import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Text } from "@/components/ui/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Une icône par étape, dans l'ordre du dictionnaire.
 *
 * Elles vivent ici et non dans les traductions : une icône n'est pas du texte,
 * et la dupliquer dans chaque langue serait une occasion de les désynchroniser.
 */
const STEP_ICONS: React.ComponentProps<typeof MaterialIcons>["name"][] = [
  "add-location-alt",
  "map",
  "search",
  "notifications-active",
  "newspaper",
  "tune",
];

/**
 * Guide de première ouverture.
 *
 * L'application cache beaucoup de choses derrière des gestes — le glissé depuis
 * le bord, le brouillon qui se restaure, l'envoi différé hors réseau, la
 * recherche. Rien de tout cela ne se devine, et une fonctionnalité qu'on ne
 * découvre pas n'existe pas.
 *
 * Il se montre une fois par appareil, puis reste dans le menu : personne ne
 * retient un guide du premier coup, et le rechercher ne doit pas être une
 * chasse au trésor.
 *
 * Toujours interruptible. Un guide qu'on ne peut pas fermer est une porte
 * fermée, pas un accueil.
 *
 * Les étapes défilent au doigt. C'est le geste que tout le monde tente devant
 * une rangée de points — et l'unique bouton « Suivant » le refusait. Le
 * défilement passe par une `ScrollView` paginée plutôt que par un détecteur de
 * gestes : dans une `Modal`, react-native-gesture-handler exige sa propre
 * racine, alors que la pagination native fonctionne partout et suit le doigt
 * image par image au lieu de sauter d'une étape à l'autre.
 */
export function GuideModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, isDark } = useAppColors();
  const t = useStrings();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const [index, setIndex] = useState(0);
  /** Largeur d'une page, mesurée : elle dépend des marges de la carte. */
  const [pageWidth, setPageWidth] = useState(0);
  const scroller = useRef<ScrollView>(null);

  const insets = useSafeAreaInsets();
  const steps = t.guide.steps;
  const isLast = index === steps.length - 1;

  // Rouvrir le guide le reprend au début : reprendre à l'étape 4 d'une lecture
  // abandonnée trois semaines plus tôt n'aurait aucun sens.
  useEffect(() => {
    if (!visible) return;
    setIndex(0);
    scroller.current?.scrollTo({ x: 0, animated: false });
  }, [visible]);

  /** Déplace la vue *et* l'état : les deux doivent rester d'accord. */
  function goTo(next: number) {
    const bounded = Math.min(Math.max(next, 0), steps.length - 1);
    setIndex(bounded);
    scroller.current?.scrollTo({ x: bounded * pageWidth, animated: true });
  }

  // Le doigt, lui, déplace la vue d'abord : l'état la rattrape à l'arrivée.
  function onSettled(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (pageWidth === 0) return;
    setIndex(Math.round(event.nativeEvent.contentOffset.x / pageWidth));
  }

  if (steps.length === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={[styles.card, { marginBottom: insets.bottom + 24 }]}>
          <TouchableOpacity
            style={styles.skip}
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t.guide.skip}
          >
            <Text style={styles.skipText}>{t.guide.skip}</Text>
          </TouchableOpacity>

          <View
            style={styles.pages}
            onLayout={(event) => setPageWidth(event.nativeEvent.layout.width)}
          >
            <ScrollView
              ref={scroller}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onSettled}
              // Le glissement lent ne déclenche pas de « momentum » : sans cet
              // écouteur, relâcher doucement laissait les points en arrière.
              onScrollEndDrag={onSettled}
              // Masqué jusqu'à la mesure : une page de largeur nulle se
              // verrait le temps d'une image.
              style={{ opacity: pageWidth === 0 ? 0 : 1 }}
            >
              {steps.map((step, position) => (
                <View key={step.title} style={[styles.page, { width: pageWidth }]}>
                  <View style={[styles.illustration, { backgroundColor: colors.primary + "1F" }]}>
                    <MaterialIcons
                      name={STEP_ICONS[position] ?? "info"}
                      size={40}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={styles.title}>{step.title}</Text>
                  <Text style={styles.body}>{step.body}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Les points disent où l'on en est et combien il reste — la seule
              question qu'on se pose devant un guide. Ils sont aussi devenus
              cliquables : une fois qu'ils annoncent un geste, les ignorer
              serait une promesse à moitié tenue. */}
          <View style={styles.dots}>
            {steps.map((step, dot) => (
              <TouchableOpacity
                key={step.title}
                onPress={() => goTo(dot)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={t.guide.stepA11y(dot + 1, steps.length)}
              >
                <View
                  style={[
                    styles.dot,
                    dot === index && { backgroundColor: colors.primary, width: 18, opacity: 1 },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Une fois seulement, à la première étape : le glissement ne se
              devine pas plus que les gestes que ce guide explique. */}
          {index === 0 && <Text style={styles.swipeHint}>{t.guide.swipeHint}</Text>}

          <View style={styles.actions}>
            {index > 0 && (
              <TouchableOpacity
                style={styles.back}
                onPress={() => goTo(index - 1)}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <Text style={styles.backText}>{t.guide.back}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.next, { backgroundColor: colors.primary }]}
              onPress={() => (isLast ? onClose() : goTo(index + 1))}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.nextText}>{isLast ? t.guide.done : t.guide.next}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ReturnType<typeof useAppColors>["colors"], isDark: boolean) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
      paddingHorizontal: 20,
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: 26,
      padding: 24,
      paddingTop: 20,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.5 : 0.18,
      shadowRadius: 24,
      elevation: 10,
    },
    skip: { alignSelf: "flex-end", paddingVertical: 4, paddingHorizontal: 6 },
    skipText: { fontSize: 13, fontWeight: "600", color: colors.text, opacity: 0.45 },
    // La rangée occupe toute la largeur de la carte ; sa hauteur est celle de la
    // page la plus longue, ce qui évite que la carte se redimensionne d'une
    // étape à l'autre.
    pages: { alignSelf: "stretch" },
    page: { alignItems: "center" },
    illustration: {
      width: 88,
      height: 88,
      borderRadius: 30,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.text,
      textAlign: "center",
      letterSpacing: -0.3,
      marginBottom: 10,
    },
    body: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.text,
      opacity: 0.65,
      textAlign: "center",
    },
    dots: { flexDirection: "row", gap: 6, marginTop: 24, marginBottom: 22 },
    swipeHint: {
      fontSize: 11.5,
      color: colors.text,
      opacity: 0.35,
      marginTop: -12,
      marginBottom: 16,
    },
    // Les points inactifs s'effacent : ils comptent les étapes, ils ne les
    // annoncent pas. Seul celui du moment porte la couleur, et s'allonge.
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.text,
      opacity: 0.18,
    },
    actions: { flexDirection: "row", gap: 10, alignSelf: "stretch" },
    back: {
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: colors.chipBg,
      alignItems: "center",
      justifyContent: "center",
    },
    backText: { fontSize: 14, fontWeight: "700", color: colors.text, opacity: 0.7 },
    next: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    nextText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  });
}
