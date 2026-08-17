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
import { countdown } from "@/utils/countdown";
import { getTabBarScrollPadding } from "@/utils/layout";
import { groupByPeriod } from "@/utils/news-groups";
import { eventShareMessage } from "@/utils/share-incident";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { memo, useCallback, useMemo, useState } from "react";
import { Pressable, SectionList, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

  const sections = useMemo(() => groupByPeriod(items ?? [], t), [items, t]);

  const refreshControl = useAppRefreshControl({
    refreshing,
    onRefresh: () => void refresh(),
    offset: 24,
  });

  /**
   * Le système choisit le destinataire, comme pour un signalement : l'application
   * n'a besoin ni des contacts ni d'une permission. Elle tend un texte.
   */
  const shareEvent = useCallback(
    (item: NewsItem) => {
      void Share.share({
        title: item.title,
        message: eventShareMessage(item),
      }).catch(() => {
        // Partage annulé, ou aucune application pour le recevoir : l'utilisateur
        // vient de fermer la feuille lui-même, il n'y a rien à lui dire.
      });
    },
    [],
  );

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
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        refreshControl={refreshControl}
        stickySectionHeadersEnabled
        renderItem={({ item }) => (
          <NewsCard
            item={item}
            styles={styles}
            openLabel={t.news.open}
            shareLabel={t.news.share}
            soon={countdown(item.startsAt, t)}
            onShare={() => shareEvent(item)}
          />
        )}
        /* Vingt-cinq dates à la file, de demain à novembre : il fallait lire
           chaque ligne pour savoir où s'arrêtait ce week-end. Un agenda se
           parcourt par périodes. */
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>{section.data.length}</Text>
            <View style={styles.sectionLine} />
          </View>
        )}
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
            <Text style={styles.source}>
              {t.news.sources(
                city.sources
                  .map((source) =>
                    source.kind === "page"
                      ? source.label
                      : t.news.sourceNational(city.name, source.radiusKm),
                  )
                  .join(", "),
              )}
            </Text>
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
  openLabel,
  shareLabel,
  soon,
  onShare,
}: {
  item: NewsItem;
  styles: ReturnType<typeof makeStyles>;
  openLabel: string;
  shareLabel: string;
  soon: string;
  onShare: () => void;
}) {
  /**
   * Le navigateur intégré plutôt qu'un renvoi vers Chrome : on revient d'un
   * geste, et l'application ne perd pas sa place. Sans lien, la carte reste
   * une carte — inerte, mais sans faux bouton.
   */
  const open = item.url
    ? () => void WebBrowser.openBrowserAsync(item.url as string).catch(() => {})
    : undefined;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && open ? styles.cardPressed : null]}
      onPress={open}
      disabled={!open}
      accessibilityRole={open ? "link" : undefined}
      accessibilityLabel={open ? `${item.title}. ${openLabel}` : undefined}
    >
      {/* Une vignette carrée, et un carré teinté quand l'événement n'a pas
          d'image — beaucoup n'en ont pas. Sans ce repli, le bord gauche de la
          liste devenait irrégulier d'une ligne à l'autre, ce qui se remarque
          bien plus qu'une image manquante. */}
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.thumb} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.thumb, styles.thumbEmpty]}>
          <MaterialIcons name="event" size={26} color={styles.place.color} />
        </View>
      )}

      <View style={styles.body}>
        {/* La date et le délai sur la même ligne. La source donne « Samedi 19
            septembre » ; savoir s'il faut compter sur ses doigts pour situer ce
            samedi-là est la seule question qu'on se pose devant un agenda. */}
        <View style={styles.whenRow}>
          {item.when ? (
            <Text style={styles.when} numberOfLines={1}>{item.when}</Text>
          ) : null}
          {soon ? (
            <View style={styles.soonChip}>
              <Text style={styles.soonText}>{soon}</Text>
            </View>
          ) : null}

        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        {/* Deux lignes de résumé, et non trois comme avant : c'est ce qui fait
            la différence entre un titre qu'on situe et une carte qu'on lit en
            entier. Le reste est dans la fiche. */}
        {item.summary ? (
          <Text style={styles.summaryText} numberOfLines={2}>{item.summary}</Text>
        ) : null}
        {item.place ? (
          <View style={styles.placeRow}>
            <MaterialIcons name="place" size={12} color={styles.place.color} />
            <Text style={styles.place} numberOfLines={1}>{item.place}</Text>
          </View>
        ) : null}
      </View>

      {/* Le chevron annonce l'appui sur la rangée, qui ouvre la fiche. Il n'est
          pas une cible lui-même — c'est la carte entière qui l'est. */}
      {open && (
        <MaterialIcons
          name="chevron-right"
          size={20}
          color={styles.place.color}
          style={styles.chevron}
        />
      )}

      {/* Le partage, hors du flux et dans le coin.
          Posé dans la rangée, il se retrouvait à côté du chevron : deux cibles
          au même bord, dont une fausse. En absolu il occupe vraiment l'angle,
          et le chevron garde le milieu du bord — deux hauteurs différentes, donc
          deux gestes qu'on ne confond plus. */}
      <TouchableOpacity
        style={styles.shareCorner}
        onPress={onShare}
        hitSlop={10}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={shareLabel}
      >
        <MaterialIcons name="share" size={15} color={styles.place.color} />
      </TouchableOpacity>
    </Pressable>
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

    separator: { height: 10 },

    // ── Intertitres ──
    // Sur le fond et non sur une carte : ils séparent, ils ne s'ajoutent pas à
    // la liste. Collants, pour qu'on sache toujours dans quelle période on est.
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingTop: 16,
      paddingBottom: 8,
      backgroundColor: c.background,
    },
    sectionTitle: {
      fontSize: 11.5,
      fontWeight: "800",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: c.text,
      opacity: 0.45,
    },
    sectionCount: { fontSize: 11.5, fontWeight: "700", color: c.primary },
    sectionLine: { flex: 1, height: 1, backgroundColor: c.chipBorder },

    // ── Carte ──
    // Une rangée et non une affiche : la vignette à gauche, le texte à droite.
    // L'image pleine largeur faisait tenir quatre événements à l'écran ; il en
    // tient sept, ce qui est ce qu'on attend d'un agenda.
    card: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      padding: 10,
      borderRadius: 16,
      backgroundColor: c.white,
      borderWidth: 1,
      borderColor: c.chipBorder,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    thumb: { width: 76, height: 76, borderRadius: 12, backgroundColor: c.chipBg, flexShrink: 0 },
    thumbEmpty: { alignItems: "center", justifyContent: "center" },
    // Le bloc du coin, aligné en haut de la rangée comme la vignette l'est de
    // l'autre côté. Le carré teinté le détache du texte : posé nu sur le fond
    // blanc, il aurait flotté sans qu'on sache s'il appartenait au titre ou à
    // la date. La cible d'appui est élargie par `hitSlop`, sans grossir le
    // carré — quinze points d'icône ne se visent pas au pouce.
    chevron: { alignSelf: "center" },
    shareCorner: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 30,
      height: 30,
      borderRadius: 10,
      backgroundColor: c.chipBg,
      borderWidth: 1,
      borderColor: c.chipBorder,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    body: { flex: 1, minWidth: 0, gap: 4 },
    // Réserve la place du bloc du coin : sans quoi la date passerait dessous.
    whenRow: { flexDirection: "row", alignItems: "center", gap: 7, flexWrap: "wrap", paddingRight: 30 },
    // La date en petites majuscules colorées, le délai en pastille pleine : le
    // second se remarque, le premier se lit.
    soonChip: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 7,
      backgroundColor: c.primary,
    },
    soonText: {
      fontSize: 10,
      fontWeight: "800",
      color: "#fff",
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
    when: {
      flexShrink: 1,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.5,
      textTransform: "uppercase",
      color: c.primary,
    },
    cardPressed: { opacity: 0.7 },
    cardTitle: { fontSize: 14.5, fontWeight: "700", color: c.text, lineHeight: 19 },
    summaryText: { fontSize: 12, color: c.text, opacity: 0.55, lineHeight: 16.5 },
    placeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
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
