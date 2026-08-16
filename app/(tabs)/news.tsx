import { useAppRefreshControl } from "@/components/ui/AppRefreshControl";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { useNews } from "@/hooks/use-news";
import { useStrings } from "@/hooks/use-strings";
import type { NewsItem } from "@/services/news";
import { getTabBarScrollPadding } from "@/utils/layout";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { memo, useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Actualités de la métropole.
 *
 * Une application de signalement dit ce qui va mal ; cet écran dit ce qui se
 * passe. Il vient d'OpenAgenda — ni lyon.fr ni le portail du Grand Lyon
 * n'exposent de flux d'actualités utilisable, vérifié endpoint par endpoint —
 * et passe par un adaptateur, `services/news.ts`, pour que changer de source ne
 * touche pas à cet écran.
 *
 * En lecture seule et sans compte : c'est le seul écran de l'application qu'on
 * peut parcourir sans rien avoir signalé.
 */
export default function NewsScreen() {
  const { colors } = useAppColors();
  const { bottom } = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, bottom), [colors, bottom]);
  const t = useStrings();
  const { items, failed, refreshing, refresh } = useNews();

  const refreshControl = useAppRefreshControl({
    refreshing,
    onRefresh: () => void refresh(),
    offset: 24,
  });

  return (
    <FlatList
      data={items ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      refreshControl={refreshControl}
      renderItem={({ item }) => <NewsCard item={item} styles={styles} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={
        <>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.titleAccent} />
              <Text style={styles.title}>{t.news.title}</Text>
            </View>
            <Text style={styles.subtitle}>{t.news.subtitle}</Text>
          </View>

          {/* Le bandeau ne remplace pas la liste : un agenda daté reste plus
              utile qu'un écran vide, et cette ligne dit qu'il l'est. */}
          {failed && <ErrorNotice detail={t.news.failed} onRetry={() => void refresh()} />}
        </>
      }
      ListEmptyComponent={
        failed ? null : (
          <View style={styles.empty}>
            <MaterialIcons name="event-busy" size={26} color={colors.text + "35"} />
            <Text style={styles.emptyText}>{t.news.empty}</Text>
          </View>
        )
      }
      ListFooterComponent={
        (items?.length ?? 0) > 0 ? <Text style={styles.source}>{t.news.source}</Text> : null
      }
    />
  );
}

const NewsCard = memo(function NewsCard({
  item,
  styles,
}: {
  item: NewsItem;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.card}>
      {/* L'image est facultative : beaucoup d'événements n'en ont pas, et une
          carte sans illustration doit rester une carte, pas un trou. */}
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.image} contentFit="cover" transition={150} />
      )}
      <View style={styles.body}>
        {item.when ? <Text style={styles.when}>{item.when}</Text> : null}
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        {item.summary ? (
          <Text style={styles.summary} numberOfLines={3}>{item.summary}</Text>
        ) : null}
        {item.place ? (
          <View style={styles.placeRow}>
            <MaterialIcons name="place" size={13} color={styles.place.color} />
            <Text style={styles.place} numberOfLines={1}>{item.place}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
});

function makeStyles(c: AppColors, bottomInset: number) {
  return StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: c.background,
      paddingHorizontal: 16,
      paddingTop: 48,
      paddingBottom: getTabBarScrollPadding(bottomInset),
    },
    header: { marginBottom: 18, paddingHorizontal: 4, gap: 6 },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    titleAccent: { width: 4, height: 24, borderRadius: 2, backgroundColor: c.primary },
    title: { fontSize: 26, fontWeight: "800", color: c.text, letterSpacing: -0.5 },
    subtitle: { fontSize: 13, color: c.text, opacity: 0.5, marginLeft: 14 },

    separator: { height: 12 },
    card: {
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: c.white,
      borderWidth: 1,
      borderColor: c.chipBorder,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    image: { width: "100%", height: 150, backgroundColor: c.chipBg },
    body: { padding: 14, gap: 5 },
    when: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.5,
      textTransform: "uppercase",
      color: c.primary,
    },
    cardTitle: { fontSize: 15.5, fontWeight: "700", color: c.text, lineHeight: 21 },
    summary: { fontSize: 13, color: c.text, opacity: 0.6, lineHeight: 19 },
    placeRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
    place: { fontSize: 12, color: c.text, opacity: 0.5, flexShrink: 1 },

    empty: { alignItems: "center", gap: 10, paddingVertical: 60 },
    emptyText: { fontSize: 13, color: c.text, opacity: 0.5, textAlign: "center" },
    // Nommer la source n'est pas une politesse : elle explique pourquoi ces
    // événements-là, et pas d'autres.
    source: { fontSize: 11, color: c.text, opacity: 0.35, textAlign: "center", marginTop: 18 },
  });
}
