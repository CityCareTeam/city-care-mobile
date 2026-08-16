import { useAppColors } from "@/hooks/use-app-colors";
import { mixHex } from "@/utils/color";
import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View, type ViewStyle } from "react-native";

/**
 * Blocs gris à la forme du contenu à venir.
 *
 * Un disque qui tourne dit « attends » sans rien dire de plus. Un squelette dit
 * *ce* qu'on attend : trois cartes de statistiques, puis une liste. Rien n'est
 * plus rapide, mais l'attente cesse d'être vide — et l'écran ne saute plus au
 * moment où le contenu arrive, puisqu'il occupait déjà la place.
 *
 * La pulsation est lente à dessein. Un clignotement rapide attire l'œil sur ce
 * qui n'est pas encore là.
 */
export function Skeleton({ style }: { style?: ViewStyle | ViewStyle[] }) {
  const { colors, isDark } = useAppColors();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // Teinte calculée : sur Android, une élévation posée sur un fond translucide
  // laisse voir son ombre à travers. Ces blocs vivent dans des cartes qui en
  // portent une.
  const tone = isDark
    ? mixHex(colors.white, "#ffffff", 0.08)
    : mixHex(colors.background, "#000000", 0.06);

  return (
    <Animated.View
      style={[
        { backgroundColor: tone, borderRadius: 8 },
        style,
        { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) },
      ]}
    />
  );
}

/** Silhouette de l'accueil : trois compteurs, puis quelques lignes. */
export function FeedSkeleton() {
  const { colors } = useAppColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Chargement">
      <View style={styles.statRow}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} style={styles.stat} />
        ))}
      </View>
      <Skeleton style={styles.sectionTitle} />
      <View style={styles.card}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.row}>
            <Skeleton style={styles.avatar} />
            <View style={styles.rowText}>
              <Skeleton style={styles.line} />
              <Skeleton style={styles.lineShort} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Silhouette des notifications : l'en-tête, puis des lignes. */
export function NotificationsSkeleton() {
  const { colors } = useAppColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Chargement">
      <Skeleton style={styles.header} />
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={[styles.card, styles.notification]}>
          <Skeleton style={styles.avatar} />
          <View style={styles.rowText}>
            <Skeleton style={styles.line} />
            <Skeleton style={styles.lineShort} />
          </View>
        </View>
      ))}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useAppColors>["colors"]) {
  return StyleSheet.create({
    statRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
    stat: { flex: 1, height: 96, borderRadius: 12 },
    sectionTitle: { width: 130, height: 18, marginBottom: 14 },
    card: {
      backgroundColor: colors.white,
      borderRadius: 16,
      padding: 14,
      gap: 18,
    },
    notification: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
    row: { flexDirection: "row", alignItems: "center", gap: 12 },
    avatar: { width: 42, height: 42, borderRadius: 13 },
    rowText: { flex: 1, gap: 7 },
    line: { height: 12, borderRadius: 6 },
    lineShort: { height: 10, width: "55%", borderRadius: 5 },
    header: { height: 84, borderRadius: 26, marginBottom: 20 },
  });
}
