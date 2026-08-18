import { useHomeStyles } from "@/components/home/home-styles";
import { Text } from "@/components/ui/AppText";
import { useAppColors } from "@/hooks/use-app-colors";
import type { Paging } from "@/hooks/use-incidents-paging";
import { useStrings } from "@/hooks/use-strings";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";

/**
 * Le pendant du bouton de `IncidentList` pour les cas où il n'y a pas de liste
 * à prolonger : un filtre qui ne trouve rien dans les pages déjà ouvertes n'est
 * pas une réponse, tant qu'il en reste à ouvrir.
 */
export function LoadMore({ paging }: { paging: Paging }) {
  const { colors } = useAppColors();
  const t = useStrings();
  const styles = useHomeStyles();
  if (!paging.hasMore) return null;

  return (
    <View style={styles.incCard}>
      <TouchableOpacity
        style={styles.showMore}
        onPress={paging.onLoadMore}
        disabled={paging.loadingMore}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={t.home.loadMoreA11y}
      >
        {paging.loadingMore ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={styles.showMoreText}>{t.home.loadMore}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
