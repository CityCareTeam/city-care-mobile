import { useAppColors } from "@/hooks/use-app-colors";
import { baseVersion, buildLabel, releaseTag } from "@/utils/app-version";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

/**
 * Version de l'application, suivie du badge de canal sur les builds hors
 * production.
 *
 * Le numéro affiché est débarrassé de son suffixe : sur `1.5.5-beta`, le badge
 * dit déjà « BETA », le répéter dans le numéro n'apprend rien. En production il
 * n'y a ni suffixe ni badge — un utilisateur final n'a pas à se demander ce
 * qu'est une « beta ».
 */
/**
 * Le repère de build est désormais un rang — `1.5.6-beta.3`. Un « 3 » posé seul
 * à côté du badge ne se lit pas comme un numéro de build ; le croisillon le dit.
 * Un repère nommé (`fix-clusters`) se suffit à lui-même.
 */
function decorate(label: string): string {
  return /^\d+$/.test(label) ? `#${label}` : label;
}

export function AppVersion() {
  const { colors, isDark } = useAppColors();
  const styles = useMemo(() => makeStyles(isDark), [isDark]);

  // Le canal vient de la config, pas de la chaîne de version : c'est lui qui
  // fait foi. Le découpage numéro / repère est mutualisé dans `utils`.
  const tag = releaseTag();
  const base = baseVersion();
  const label = buildLabel();

  return (
    <View
      style={styles.row}
      accessibilityRole="text"
      accessibilityLabel={
        tag
          ? `Version ${base}, version d'essai ${tag}${label ? `, build ${label}` : ""}`
          : `Version ${base}`
      }
    >
      <Text style={[styles.version, { color: colors.text }]}>v{base}</Text>
      {tag && (
        <View
          style={[
            styles.badge,
            { backgroundColor: colors.primary + "1F", borderColor: colors.primary + "4D" },
          ]}
        >
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.badgeText, { color: colors.primary }]}>
            {tag.toUpperCase()}
          </Text>
        </View>
      )}
      {tag && label !== "" && (
        <Text style={[styles.label, { color: colors.text }]}>{decorate(label)}</Text>
      )}
    </View>
  );
}

function makeStyles(isDark: boolean) {
  return StyleSheet.create({
    row: {
      marginTop: 24,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    version: {
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: 0.2,
      opacity: isDark ? 0.35 : 0.3,
      fontVariant: ["tabular-nums"],
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderRadius: 999,
      borderWidth: 1,
      paddingLeft: 7,
      paddingRight: 9,
      paddingVertical: 3,
    },
    dot: { width: 5, height: 5, borderRadius: 2.5 },
    // Repère de build : présent pour qui le cherche, effacé pour les autres.
    label: {
      fontSize: 10,
      fontWeight: "600",
      opacity: isDark ? 0.28 : 0.24,
      fontVariant: ["tabular-nums"],
    },
    badgeText: {
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 0.8,
    },
  });
}
