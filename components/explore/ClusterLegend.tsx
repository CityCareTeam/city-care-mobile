import { GlassSurface } from "@/components/ui/GlassSurface";
import type { CLUSTER_DENSITY } from "@/constants/incidents";
import { useAppColors } from "@/hooks/use-app-colors";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type DensityTier = (typeof CLUSTER_DENSITY)[number];

type Props = {
  /** Paliers réellement atteints par les pastilles à l'écran. */
  tiers: readonly DensityTier[];
  bottom: number;
};

/**
 * Sans repère, une pastille rouge se lit comme un quatrième statut. Cette
 * légende dit qu'il s'agit d'un volume — et n'affiche que les paliers
 * effectivement présents sur la carte, pour ne jamais expliquer une couleur
 * que l'utilisateur n'a pas sous les yeux.
 */
export function ClusterLegend({ tiers, bottom }: Props) {
  const { isDark } = useAppColors();
  const styles = useMemo(() => makeStyles(isDark), [isDark]);

  // Du moins dense au plus dense — l'ordre de lecture, pas celui de la constante
  const ordered = useMemo(() => [...tiers].reverse(), [tiers]);
  if (ordered.length === 0) return null;

  return (
    <GlassSurface style={[styles.surface, { bottom }]} transparentToTouch>
      <Text style={styles.title}>Signalements</Text>
      {ordered.map((tier) => (
        <View key={tier.min} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: tier.color }]} />
          <Text style={styles.label}>{tier.label}</Text>
        </View>
      ))}
    </GlassSurface>
  );
}

function makeStyles(isDark: boolean) {
  return StyleSheet.create({
    surface: {
      position: "absolute",
      left: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 16,
    },
    title: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.3,
      color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)",
    },
    row: { flexDirection: "row", alignItems: "center", gap: 5 },
    dot: { width: 9, height: 9, borderRadius: 4.5 },
    label: {
      fontSize: 12,
      fontWeight: "700",
      color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.72)",
    },
  });
}
