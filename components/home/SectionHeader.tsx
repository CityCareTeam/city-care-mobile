import { useHomeStyles } from "@/components/home/home-styles";
import { Text } from "@/components/ui/AppText";
import { useAppColors } from "@/hooks/use-app-colors";
import { View } from "react-native";

export function SectionHeader({ title, count }: { title: string; count?: number }) {
  const { colors } = useAppColors();
  const styles = useHomeStyles();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <View style={[styles.sectionAccent, { backgroundColor: colors.primary }]} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {count !== undefined && (
        <View style={[styles.countBadge, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.countBadgeText, { color: colors.primary }]}>{count}</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Distance d'une ligne à l'utilisateur, ou rien quand on l'ignore.
 *
 * L'origine n'existe qu'une fois la position obtenue — c'est-à-dire une fois
 * que l'utilisateur a demandé le tri par proximité. Elle reste ensuite : savoir
 * qu'un signalement est à 300 m reste utile quand on repasse à l'ordre
 * chronologique, et rien ne justifie de le taire.
 *
 * « Mes signalements » n'embarquent pas de coordonnées : ces lignes n'affichent
 * simplement pas de distance, plutôt que d'en inventer une.
 */
