import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { FeedSkeleton } from "@/components/ui/Skeleton";
import { HeaderClock } from "@/components/ui/HeaderClock";
import { Logo } from "@/components/ui/Logo";
import { ROLE_LABELS } from "@/constants/roles";
import { getTabBarScrollPadding } from "@/utils/layout";
import { useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/use-app-colors";
import { AdminView } from "@/components/home/AdminView";
import { AgentView } from "@/components/home/AgentView";
import { CitizenView } from "@/components/home/CitizenView";
import { useHomeStyles } from "@/components/home/home-styles";
import { useAppMenu } from "@/context/AppMenuContext";
import { useAppRefreshControl } from "@/components/ui/AppRefreshControl";
import { useAppUpdate } from "@/hooks/use-app-update";
import { useDraftCount } from "@/hooks/use-draft-indicator";
import { useNearbyAlerts } from "@/hooks/use-nearby-alerts";
import { useUserLocation } from "@/hooks/use-user-location";
import { useWeather } from "@/hooks/use-weather";
import { formatTemperature, weatherIcon } from "@/utils/weather-code";
import { useStrings } from "@/hooks/use-strings";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { Toast } from "@/components/ui/ToastMessage";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { INCIDENTS_PAGE_SIZE, POLL_INTERVAL_MS } from "@/constants/config";
import { getIncidents } from "@/services/incidents";
import { useContentReport } from "@/hooks/use-content-report";
import { getMyIncidents } from "@/services/users";
import { getValidToken } from "@/storage/tokens";
import { loadIncidentsCache, saveIncidentsCache } from "@/storage/incidents-cache";
import { usePendingReports } from "@/hooks/use-pending-reports";
import { timeAgo } from "@/utils/format-date";
import type { Paging } from "@/hooks/use-incidents-paging";
import { useIncidentsPaging } from "@/hooks/use-incidents-paging";
import type { MyIncidentItem } from "@/types/users";
import { EasterEggDog } from "@/components/easter-egg-dog";
import { useEasterEgg } from "@/hooks/use-easter-egg";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "@/components/ui/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function today(locale: string): string {
  const label = new Date().toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  // Les jours de la semaine sont déjà capitalisés en anglais ; en français,
  // `toLocaleDateString` rend « dimanche ».
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function HomeScreen() {
  const { colors } = useAppColors();
  const styles = useHomeStyles();
  const { role, firstName, loading: authLoading } = useAuth();
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [myIncidents, setMyIncidents] = useState<MyIncidentItem[]>([]);
  const {
    incidents: allIncidents,
    receiveFirstPage,
    seed,
    loadMore,
    totalCount,
    loadingMore,
    hasMore,
  } = useIncidentsPaging();
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const { pending, rejected, flush, dismissRejected } = usePendingReports();

  /**
   * Le fil du citoyen, moins ce qu'il a lui-même signalé.
   *
   * La carte filtrait déjà, l'accueil non : le contenu signalé y restait, et
   * rouvrir sa fiche laissait le signaler une seconde fois — que le serveur
   * refuse (409) mais que l'application présentait comme un envoi réussi. On ne
   * signale pas deux fois, et surtout on ne le voit pas deux fois.
   *
   * Seulement pour les citoyens : un agent doit continuer à voir ce qu'il a
   * masqué, c'est sa file de travail.
   */
  const { hiddenIncidents } = useContentReport();
  const citizenFeed = useMemo(
    () => allIncidents.filter((incident) => !hiddenIncidents.includes(incident.id)),
    [allIncidents, hiddenIncidents],
  );

  const { active: dogActive, onTap: onLogoTap, dismiss: dismissDog } = useEasterEgg();
  const { open: openMenu } = useAppMenu();
  const draftCount = useDraftCount();
  const hasDraft = draftCount > 0;
  const weather = useWeather();
  const t = useStrings();
  const { ready: updateReady } = useAppUpdate();

  /**
   * L'alerte de proximité se greffe ici plutôt que d'avoir son propre timer :
   * cet écran rafraîchit déjà le fil toutes les quinze secondes, et c'est
   * exactement ce qu'il faut regarder. Elle ne demande pas la position
   * elle-même — la météo l'a déjà, et une seconde demande pour la même chose
   * serait discourtoise.
   */
  const { coords: here, precise: hereIsReal } = useUserLocation();
  const { dbUser } = useAuth();
  useNearbyAlerts(allIncidents, hereIsReal ? here : null, dbUser?.id);

  // Le dernier état connu, le temps que le réseau réponde — et à la place de
  // l'écran vide s'il ne répond pas.
  useEffect(() => {
    void (async () => {
      const cache = await loadIncidentsCache();
      if (cache) {
        seed(cache.incidents, cache.totalCount);
        setCachedAt(cache.savedAt);
      }
    })();
  }, [seed]);

  const load = useCallback(async (isRefresh = false, silent = false) => {
    if (role === null) return;
    if (!silent) {
      if (isRefresh) setRefreshing(true);
      else setIncidentsLoading(true);
    }

    try {
      const token = await getValidToken();
      if (!token) return;

      // Une seule page relue, jamais toutes celles déjà ouvertes : un
      // rafraîchissement silencieux part toutes les quinze secondes, et le
      // multiplier par le nombre de pages déroulées se paierait en batterie
      // autant qu'en charge serveur. Un tiré-pour-rafraîchir, lui, repart de
      // zéro — c'est le geste par lequel on demande explicitement du propre.
      // Les agents et les admins voient aussi ce que la modération a retiré, en
      // rouge : c'est leur file de travail, un contenu masqué qui en disparaît
      // sans laisser de trace donne l'impression qu'il n'a jamais existé. Les
      // citoyens gardent la liste publique, où le masqué n'a rien à faire.
      const firstPage = getIncidents({
        page: 1,
        pageSize: INCIDENTS_PAGE_SIZE.load,
        includeHidden: role !== "Citizen",
        token,
      });
      const [myRes, allRes] = await Promise.all([
        role === "Citizen" ? getMyIncidents(token) : Promise.resolve(null),
        firstPage,
      ]);

      if (myRes) setMyIncidents(myRes.data);
      // Seul le tiré-pour-rafraîchir referme les pages ouvertes : c'est le
      // geste par lequel on demande explicitement du propre.
      receiveFirstPage(allRes, { reset: isRefresh });
      setFailed(false);
      setCachedAt(null);
      void saveIncidentsCache(allRes.data, allRes.pagination.total_count);
      // Le réseau vient de répondre : c'est le meilleur moment pour rejouer ce
      // qui attendait, et un signal plus fiable qu'un indicateur de connexion.
      // Le bandeau « en attente » disparaîtrait sinon sans un mot, et rien ne
      // dirait à l'utilisateur si son signalement est parti ou s'il a été perdu.
      void flush().then((sent) => {
        if (sent === 0) return;
        Toast.show({
          type: "success",
          text1: t.home.sentReports(sent),
          text2: t.home.sentReportsDetail,
        });
      });
    } catch {
      setFailed(true);
    } finally {
      if (!silent) {
        setIncidentsLoading(false);
        setRefreshing(false);
      }
    }
  }, [role, receiveFirstPage, flush, t.home]);

  const paging = useMemo<Paging>(
    () => ({
      totalCount,
      hasMore,
      loadingMore,
      onLoadMore: () => void loadMore().then((ok) => setFailed(!ok)),
    }),
    [totalCount, hasMore, loadingMore, loadMore],
  );

  // Recharge à l'arrivée sur l'écran puis en silence, et resserre la cadence
  // tant qu'un chargement échoue — c'est ce qui rattrape le retour du réseau.
  useAutoRefresh(
    useCallback((silent: boolean) => void load(false, silent), [load]),
    { interval: POLL_INTERVAL_MS.incidents, failed, enabled: role !== null },
  );

  const navigateToIncident = useCallback((id: string) => {
    router.navigate({
      pathname: "/(tabs)/explore",
      params: { selectId: id },
    });
  }, []);

  const insets = useSafeAreaInsets();

  // Avant le retour anticipé qui suit : c'est un crochet.
  const refreshControl = useAppRefreshControl({
    refreshing,
    onRefresh: () => void load(true),
    offset: insets.top,
  });

  // Voile plein réservé au premier chargement : il effaçait l'écran entier à
  // chaque retour sur l'onglet, alors qu'il y avait déjà quelque chose à voir.
  const hasContent = allIncidents.length > 0 || myIncidents.length > 0;
  if (authLoading || (incidentsLoading && !hasContent)) {
    return (
      <View style={[styles.scroll, styles.content, { paddingTop: insets.top + 12 }]}>
        <FeedSkeleton />
      </View>
    );
  }

  return (
    <>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: getTabBarScrollPadding(insets.bottom) }]}
      refreshControl={refreshControl}
    >
      {failed && (
        <ErrorNotice
          detail={
            cachedAt
              ? t.home.cachedData(timeAgo(cachedAt))
              : t.home.staleData
          }
          onRetry={() => void load(true)}
        />
      )}

      {pending.length > 0 && (
        <View style={styles.pendingNotice} testID="pending-notice">
          <MaterialIcons name="cloud-upload" size={18} color={colors.primary} />
          <Text style={styles.pendingText}>{t.home.pendingReports(pending.length)}</Text>
        </View>
      )}

      {rejected.length > 0 && (
        <ErrorNotice
          title={t.home.rejectedReports(rejected.length)}
          detail={rejected[0].reason}
          onRetry={() => void dismissRejected()}
          actionLabel={t.home.acknowledge}
        />
      )}

      {/* En-tête ─────────────────────────────────────────────────────────
          Trois étages, du service à l'identité puis au contexte : la rangée
          d'outils (heure, menu) que l'œil traverse, la salutation qui porte le
          bloc, et la météo posée dessous comme une donnée et non comme une
          phrase. Le nom de la marque a disparu du texte : le logo le dit déjà,
          à dix pixels de là. */}
      <View style={styles.headerCard}>
        <View style={styles.utilityRow}>
          <HeaderClock />
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={openMenu}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t.menu.open}
          >
            <MaterialIcons name="menu" size={19} color="#fff" />
            {/* La bannière de mise à jour ne passe qu'une fois ; cette
                pastille, elle, reste jusqu'à ce qu'on s'en occupe. */}
            {updateReady && <View style={styles.menuDot} />}
          </TouchableOpacity>
        </View>

        <View style={styles.headerRow}>
          <View style={styles.identity}>
            <View style={styles.metaRow}>
              <Text style={styles.greeting} numberOfLines={1}>
                {firstName ? t.home.greetingNamed(firstName) : t.home.greeting}
              </Text>
              {/* Le badge accompagne le prénom, pas la date : il dit qui on est,
                  pas quand on est.

                  Et il ne paraît que pour un agent ou un administrateur.
                  « Citoyen » est le rôle par défaut : l'annoncer à un citoyen
                  n'apprend rien et occupe la place. Un agent, lui, a besoin de
                  savoir sous quelle casquette il regarde — son écran n'est pas
                  le même. */}
              {role && role !== "Citizen" && (
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>{ROLE_LABELS[role] ?? role}</Text>
                </View>
              )}
            </View>
            <Text style={styles.headerDate}>{today(t.locale)}</Text>
          </View>
          <TouchableOpacity onPress={onLogoTap} activeOpacity={1}>
            <Logo size={72} />
          </TouchableOpacity>
        </View>

        {/* La météo n'apparaît que lorsqu'elle a quelque chose à dire : une
            ligne qui clignote entre un chargement, une erreur et une
            température vaut moins que pas de météo du tout. */}
        {weather && (
          <View style={styles.weatherChip}>
            <MaterialIcons
              name={weatherIcon(weather.condition, weather.isDay)}
              size={15}
              color="#fff"
            />
            <Text style={styles.weatherTemp}>{formatTemperature(weather.temperature)}</Text>
            <Text style={styles.weatherLabel} numberOfLines={1}>
              {weather.city
                ? `${t.weather[weather.condition]} · ${weather.city}`
                : t.weather[weather.condition]}
            </Text>
          </View>
        )}

        {role === "Citizen" && (
          <TouchableOpacity style={styles.reportShortcut} onPress={() => router.push("/report")} activeOpacity={0.8}>
            <MaterialIcons name="add-circle-outline" size={16} color="#fff" />
            <Text style={styles.reportShortcutText}>
              {hasDraft ? t.home.resumeReport : t.home.reportIncident}
            </Text>
            {/* Le brouillon se restaure tout seul, mais rien ne le disait avant
                d'ouvrir le formulaire : on pouvait l'avoir oublié. */}
            {hasDraft && (
              <View style={styles.draftPill}>
                <Text style={styles.draftPillText}>
                  {draftCount > 1 ? `${t.home.draftBadge} · ${draftCount}` : t.home.draftBadge}
                </Text>
              </View>
            )}
            <MaterialIcons name="chevron-right" size={16} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        )}
      </View>

      {role === "Citizen" && (
        <CitizenView
          incidents={myIncidents}
          allIncidents={citizenFeed}
          onPress={navigateToIncident}
          paging={paging}
        />
      )}
      {role === "Agent" && (
        <AgentView incidents={allIncidents} onPress={navigateToIncident} paging={paging} />
      )}
      {role === "Admin" && (
        <AdminView incidents={allIncidents} onPress={navigateToIncident} paging={paging} />
      )}
    </ScrollView>

    <EasterEggDog visible={dogActive} onHide={dismissDog} />
    </>
  );
}
