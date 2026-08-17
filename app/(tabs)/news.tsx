import { useAppRefreshControl } from "@/components/ui/AppRefreshControl";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { ModalShell } from "@/components/ui/ModalShell";
import { NEWS_CITIES, type NewsCity } from "@/constants/news-cities";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { useNews } from "@/hooks/use-news";
import { useNewsCity } from "@/hooks/use-news-city";
import { useStrings } from "@/hooks/use-strings";
import type { NewsItem } from "@/services/news";
import { mixHex } from "@/utils/color";
import { getTabBarScrollPadding } from "@/utils/layout";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { memo, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Actualités de la ville.
 *
 * Une application de signalement dit ce qui va mal ; cet écran dit ce qui se
 * passe. Il vient d'OpenAgenda — ni lyon.fr ni le portail du Grand Lyon
 * n'exposent de flux d'actualités utilisable, vérifié endpoint par endpoint —
 * et passe par un adaptateur, `services/news.ts`, pour que changer de source ne
 * touche pas à cet écran.
 *
 * La ville est proposée d'après la position, et choisie à la main dès qu'on le
 * souhaite. Les trois raisons de n'avoir aucune ville — position refusée, trop
 * loin des villes couvertes, agenda vide — donnent trois phrases distinctes :
 * elles se règlent différemment.
 */
export default function NewsScreen() {
  const { colors } = useAppColors();
  const { bottom } = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, bottom), [colors, bottom]);
  const t = useStrings();

  const { city, origin, choose } = useNewsCity();
  const { items, failed, refreshing, refresh } = useNews(city);
  const [picking, setPicking] = useState(false);

  const refreshControl = useAppRefreshControl({
    refreshing,
    onRefresh: () => void refresh(),
    offset: 24,
  });

  // La ligne sous le titre est la seule qui puisse dire à la fois où on est et
  // pourquoi on n'est nulle part.
  const summary = city
    ? items === null
      ? t.news.loading
      : t.news.count(items.length)
    : origin === "pending"
      ? t.news.locating
      : origin === "uncovered"
        ? t.news.uncovered
        : t.news.unavailable;

  return (
    <>
      <FlatList
        data={items ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        refreshControl={refreshControl}
        renderItem={({ item }) => <NewsCard item={item} styles={styles} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <>
            {/* Même bande teintée que les notifications : deux écrans en liste,
                deux en-têtes de la même famille. */}
            <View style={styles.headerCard}>
              <View style={[styles.headerIcon, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="newspaper" size={24} color="#fff" />
              </View>

              <View style={styles.headerText}>
                <Text style={styles.title}>{t.news.title}</Text>
                <Text style={styles.summary} numberOfLines={2}>
                  {summary}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.cityBtn}
                onPress={() => setPicking(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t.news.changeCity}
              >
                <Text style={styles.cityName} numberOfLines={1}>
                  {city?.name ?? t.news.choose}
                </Text>
                <MaterialIcons name="expand-more" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Le bandeau ne remplace pas la liste : un agenda daté reste plus
                utile qu'un écran vide, et cette ligne dit qu'il l'est. */}
            {failed && <ErrorNotice detail={t.news.failed} onRetry={() => void refresh()} />}
          </>
        }
        ListEmptyComponent={
          failed ? null : (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <MaterialIcons
                  name={city ? "event-busy" : "location-off"}
                  size={30}
                  color={colors.text + "40"}
                />
              </View>
              <Text style={styles.emptyText}>
                {city ? (items === null ? t.news.loading : t.news.empty) : t.news.pickPrompt}
              </Text>
              {!city && (
                <TouchableOpacity
                  style={styles.emptyAction}
                  onPress={() => setPicking(true)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <Text style={styles.emptyActionLabel}>{t.news.choose}</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
        ListFooterComponent={
          city && (items?.length ?? 0) > 0 ? (
            <Text style={styles.source}>{t.news.source(city.name, city.radiusKm)}</Text>
          ) : null
        }
      />

      <ModalShell visible={picking} title={t.news.pickTitle} onClose={() => setPicking(false)}>
        <View style={styles.cityList}>
          {NEWS_CITIES.map((option) => (
            <CityOption
              key={option.id}
              city={option}
              selected={option.id === city?.id}
              styles={styles}
              accent={colors.primary}
              onPress={() => {
                choose(option);
                setPicking(false);
              }}
            />
          ))}
        </View>
      </ModalShell>
    </>
  );
}

function CityOption({
  city,
  selected,
  styles,
  accent,
  onPress,
}: {
  city: NewsCity;
  selected: boolean;
  styles: ReturnType<typeof makeStyles>;
  accent: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.cityRow, selected && styles.cityRowSelected]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <MaterialIcons name="place" size={19} color={selected ? accent : styles.cityRowLabel.color} />
      <Text style={[styles.cityRowLabel, selected && { color: accent, fontWeight: "800" }]}>
        {city.name}
      </Text>
      {selected && <MaterialIcons name="check" size={19} color={accent} />}
    </TouchableOpacity>
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
          <Text style={styles.summaryText} numberOfLines={3}>{item.summary}</Text>
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

    // ── En-tête ──
    // Repris des notifications au trait près : bande teintée sans ombre ni
    // bordure, débordant dans les marges, teinte calculée et non superposée —
    // un fond translucide laisse voir les ombres à travers sur Android.
    headerCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 16,
      paddingHorizontal: 17,
      marginHorizontal: -4,
      borderRadius: 26,
      backgroundColor: mixHex(c.background, c.primary, 0.16),
      marginBottom: 20,
    },
    headerIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: "center",
      justifyContent: "center",
    },
    headerText: { flex: 1, gap: 2 },
    title: { fontSize: 24, fontWeight: "800", color: c.text, letterSpacing: -0.4 },
    summary: { fontSize: 13, color: c.text, opacity: 0.55 },
    // Là où les notifications posent des boutons ronds : même fond blanc, même
    // détachement de la bande, mais une pastille, parce qu'elle porte un nom.
    cityBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      maxWidth: 118,
      paddingLeft: 12,
      paddingRight: 7,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.white,
    },
    cityName: { fontSize: 13, fontWeight: "700", color: c.text, flexShrink: 1 },

    // ── Choix de la ville ──
    cityList: { gap: 8 },
    cityRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: c.chipBg,
      borderWidth: 1,
      borderColor: c.chipBorder,
    },
    cityRowSelected: { backgroundColor: mixHex(c.white, c.primary, 0.12), borderColor: c.primary },
    cityRowLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: c.text },

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
    summaryText: { fontSize: 13, color: c.text, opacity: 0.6, lineHeight: 19 },
    placeRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
    place: { fontSize: 12, color: c.text, opacity: 0.5, flexShrink: 1 },

    // ── Vide ──
    empty: { alignItems: "center", gap: 14, paddingVertical: 60 },
    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyText: { fontSize: 13, color: c.text, opacity: 0.5, textAlign: "center" },
    emptyAction: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: c.primary,
    },
    emptyActionLabel: { fontSize: 13, fontWeight: "700", color: "#fff" },

    // Nommer la source n'est pas une politesse : elle explique pourquoi ces
    // événements-là, et pas d'autres.
    source: { fontSize: 11, color: c.text, opacity: 0.35, textAlign: "center", marginTop: 18 },
  });
}
