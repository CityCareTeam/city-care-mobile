import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { IncidentFilterBar } from "@/components/incident-filter-bar";
import { ClusterLegend } from "@/components/explore/ClusterLegend";
import { AddressSearch } from "@/components/explore/AddressSearch";
import { IncidentDetailSheet } from "@/components/explore/IncidentDetailSheet";
import { MapNotice, MapNoticeKind } from "@/components/explore/MapNotice";
import { CLUSTER_PIN_ANCHOR, ClusterPin, MAP_PIN_ANCHOR, MapPin } from "@/components/ui/MapPin";
import { CLUSTER_ZOOM_THRESHOLD, DEFAULT_LOCATION, INCIDENTS_PAGE_SIZE, MAP_ANIMATION_MS, MAP_DELTAS, POLL_INTERVAL_MS } from "@/constants/config";
import { CLUSTER_DENSITY, MAP_STATUS_COLOR, STATUS_LABEL, TYPE_LABEL } from "@/constants/incidents";
import { clusterColor } from "@/utils/cluster-color";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { useAuth } from "@/context/AuthContext";
import { useDraftCount } from "@/hooks/use-draft-indicator";
import { useFollowedIncidents } from "@/hooks/use-followed-incidents";
import { useStrings } from "@/hooks/use-strings";
import { useIncidentFilters } from "@/hooks/use-incident-filters";
import { useIncidentPermissions } from "@/hooks/use-incident-permissions";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { useMapClusters } from "@/hooks/use-map-clusters";
import { useContentReport } from "@/hooks/use-content-report";
import { useUserLocation } from "@/hooks/use-user-location";
import { getIncidents } from "@/services/incidents";
import { loadIncidentsCache, saveIncidentsCache } from "@/storage/incidents-cache";
import type { IncidentResponse, MapClusterDto } from "@/types/incidents";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Markers ──────────────────────────────────────────────────────────────────

/**
 * Android rasterise la vue du marker : tant que `tracksViewChanges` est faux,
 * il réutilise le bitmap précédent. Il faut donc rouvrir une fenêtre de capture
 * dès qu'un pixel du marker change — la signature liste tout ce qui est dessiné.
 */
function useMarkerCapture(signature: string) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    const t = setTimeout(() => setTracksViewChanges(false), MAP_ANIMATION_MS.trackViewChange);
    return () => clearTimeout(t);
  }, [signature]);

  return tracksViewChanges;
}

function IncidentMarker({ incident, color, active, onPress }: {
  incident: IncidentResponse;
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  const tracksViewChanges = useMarkerCapture(`${color}|${incident.type}|${active}`);

  return (
    <Marker
      coordinate={{ latitude: incident.latitude, longitude: incident.longitude }}
      tracksViewChanges={active || tracksViewChanges}
      anchor={active ? MAP_PIN_ANCHOR.active : MAP_PIN_ANCHOR.rest}
      zIndex={active ? 1000 : 1}
      accessibilityLabel={`${TYPE_LABEL[incident.type] ?? incident.type}, ${STATUS_LABEL[incident.status] ?? incident.status}`}
      onPress={onPress}
    >
      <MapPin color={color} type={incident.type} active={active} />
    </Marker>
  );
}

function ClusterMarker({ cluster, singleType, onPress }: {
  cluster: MapClusterDto;
  /** Type du signalement lorsque la cellule n'en contient qu'un seul. */
  singleType?: string;
  onPress: () => void;
}) {
  // Une cellule à un seul signalement se lit mieux en épingle qu'en pastille « 1 »
  const isSingle = cluster.count <= 1;
  const color = clusterColor(cluster);

  // La rasterisation permanente n'est plus nécessaire : le bitmap d'un marker
  // Android est dimensionné à la première capture et ne grandit plus, or la
  // pastille a désormais la même taille quel que soit le compteur. On revient
  // donc à une fenêtre de capture courte — re-rasteriser à chaque image pendant
  // qu'on fait glisser la carte est le poste le plus coûteux de l'écran.
  const tracksViewChanges = useMarkerCapture(`${cluster.count}|${color}|${singleType ?? ""}`);

  return (
    <Marker
      coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }}
      tracksViewChanges={tracksViewChanges}
      // Pastille et épingle sont la même larme : la pointe désigne la coordonnée
      anchor={isSingle ? MAP_PIN_ANCHOR.rest : CLUSTER_PIN_ANCHOR}
      // Les petits clusters passent au-dessus des gros, qui les masqueraient
      zIndex={1000 - Math.min(cluster.count, 999)}
      accessibilityLabel={isSingle ? "1 signalement" : `${cluster.count} signalements regroupés`}
      onPress={onPress}
    >
      {isSingle
        ? <MapPin color={color} type={singleType} />
        : <ClusterPin count={cluster.count} color={color} />}
    </Marker>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

/** Recul des filtres sous l'encoche — ils étaient collés à la barre d'état. */
const FILTER_BAR_TOP = 22;
/** Hauteur des deux rangées de filtres, pour poser le panneau juste dessous. */
const FILTER_BAR_HEIGHT = 100;

const INITIAL_REGION: Region = {
  ...DEFAULT_LOCATION,
  latitudeDelta: MAP_DELTAS.explore,
  longitudeDelta: MAP_DELTAS.explore,
};

export default function SignalementsScreen() {
  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [incidentsFailed, setIncidentsFailed] = useState(false);
  /** Vrai tant que les épingles affichées viennent du cache et non du réseau. */
  const [incidentsStale, setIncidentsStale] = useState(false);
  const freshPins = useRef(false);
  const [selected, setSelected] = useState<IncidentResponse | null>(null);
  const [initialTab, setInitialTab] = useState<"details" | "chat">("details");
  const [placeSearch, setPlaceSearch] = useState(false);

  const { region: userRegion, precise: knowsWhereWeAre } = useUserLocation(MAP_DELTAS.user);
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, insets.bottom), [colors, insets.bottom]);
  const { canReportIncident } = useIncidentPermissions(null);
  const draftCount = useDraftCount();
  const hasDraft = draftCount > 0;
  const t = useStrings();
  const { filterType, setFilterType, filterStatus, setFilterStatus, filteredIncidents } = useIncidentFilters(incidents, "map");

  // « Les miens » : un filtre sur l'auteur, que le serveur ne connaît pas — les
  // grappes qu'il renvoie comptent tous les signalements. On force donc les
  // épingles individuelles quand il est actif : les siens se comptent en
  // dizaines, les afficher tous ne coûte rien.
  const [mineOnly, setMineOnly] = useState(false);
  const [followedOnly, setFollowedOnly] = useState(false);
  const { dbUser } = useAuth();
  const { followed } = useFollowedIncidents();

  const { hiddenIncidents } = useContentReport();

  const visibleIncidents = useMemo(() => {
    // Masqué par l'utilisateur : il vient de le signaler, il n'a pas à le
    // recroiser en attendant qu'un modérateur tranche.
    let visible = filteredIncidents.filter((i) => !hiddenIncidents.includes(i.id));
    if (mineOnly && dbUser) visible = visible.filter((i) => i.authorUserId === dbUser.id);
    if (followedOnly) visible = visible.filter((i) => followed.has(i.id));
    return visible;
  }, [filteredIncidents, mineOnly, dbUser, followedOnly, followed, hiddenIncidents]);
  const { clusters, failed: clustersFailed, stale: clustersStale, currentZoom, currentRegionRef, onRegionChangeComplete, reload: reloadClusters } =
    useMapClusters(filterStatus, filterType, userRegion ?? INITIAL_REGION);

  const mapRef = useRef<MapView>(null);
  const markerJustPressed = useRef(false);
  const pendingSelectRef = useRef<string | null>(null);

  // ── Load incidents ──
  const loadIncidents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Sans pageSize le back renvoie sa page par défaut : les épingles
      // manquaient une fois zoomé alors que les clusters les comptaient.
      const res = await getIncidents({ pageSize: INCIDENTS_PAGE_SIZE.load });
      setIncidents(res.data);
      setIncidentsFailed(false);
      setIncidentsStale(false);
      freshPins.current = true;
      // Le même cache que le fil : même endpoint, même page, même fraîcheur.
      // Les deux écrans se rendent donc service l'un à l'autre — ouvrir
      // l'accueil garnit la carte, et l'inverse.
      void saveIncidentsCache(res.data, res.pagination.total_count);
    } catch {
      setIncidentsFailed(true);

      // Le dernier état connu, mais seulement si rien n'a jamais abouti : en
      // cours de session, ce qui est affiché vient du réseau et vaut mieux.
      if (!freshPins.current) {
        const cache = await loadIncidentsCache();
        if (cache && cache.incidents.length > 0) {
          setIncidents(cache.incidents);
          setIncidentsStale(true);
        }
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  /**
   * Défait tous les filtres d'un coup, y compris les deux qui vivent hors du
   * hook — « les miens » et « suivis » sont locaux à cet écran, et les oublier
   * ici laisserait le panneau promettre plus qu'il ne tient.
   */
  /** Ramène la carte sur l'utilisateur, au cadrage d'ouverture. */
  const recenter = useCallback(() => {
    if (!userRegion) return;
    mapRef.current?.animateToRegion(userRegion, MAP_ANIMATION_MS.animateRegion);
  }, [userRegion]);

  const clearFilters = useCallback(() => {
    setFilterType(null);
    setFilterStatus(null);
    setMineOnly(false);
    setFollowedOnly(false);
  }, [setFilterType, setFilterStatus]);

  const handleRefresh = useCallback(async () => {
    await loadIncidents();
    reloadClusters();
  }, [loadIncidents, reloadClusters]);

  // ── Select + animate map ──
  const selectIncident = useCallback((inc: IncidentResponse) => {
    setSelected(inc);
    setTimeout(() => {
      mapRef.current?.animateToRegion(
        {
          latitude: inc.latitude - MAP_DELTAS.incidentOffset,
          longitude: inc.longitude,
          latitudeDelta: MAP_DELTAS.incident,
          longitudeDelta: MAP_DELTAS.incident,
        },
        MAP_ANIMATION_MS.animateRegion,
      );
    }, MAP_ANIMATION_MS.selectDelay);
  }, []);

  // ── Cluster tap → zoom in ──
  // Le zoom passe par une ref : s'il entrait dans les dépendances, ce callback
  // changerait à chaque déplacement de carte et ferait recréer tous les
  // marqueurs de regroupement au fil du geste.
  const zoomRef = useRef(currentZoom);
  useEffect(() => { zoomRef.current = currentZoom; }, [currentZoom]);

  const handleClusterPress = useCallback((cluster: MapClusterDto) => {
    // Un cluster isolé va directement au niveau détail, sinon on zoome par paliers
    const newZoom = cluster.count <= 1
      ? CLUSTER_ZOOM_THRESHOLD + 2
      : Math.min(zoomRef.current + 3, CLUSTER_ZOOM_THRESHOLD + 1);
    const delta = 360 / Math.pow(2, newZoom);
    mapRef.current?.animateToRegion(
      { latitude: cluster.latitude, longitude: cluster.longitude, latitudeDelta: delta, longitudeDelta: delta },
      MAP_ANIMATION_MS.animateRegion,
    );
  }, []);

  // ── selectId (depuis une notification) ──
  const { selectId, tab: tabParam } = useLocalSearchParams<{ selectId?: string; tab?: string }>();

  useEffect(() => {
    if (!selectId) return;
    setSelected(null);
    pendingSelectRef.current = selectId;
    loadIncidents();
  }, [selectId, loadIncidents]);

  useEffect(() => {
    if (!pendingSelectRef.current || incidents.length === 0) return;
    const inc = incidents.find((i) => i.id === pendingSelectRef.current);
    if (inc) {
      pendingSelectRef.current = null;
      setInitialTab(tabParam === "chat" ? "chat" : "details");
      selectIncident(inc);
    }
  }, [incidents, selectIncident, tabParam]);

  const refreshAll = useCallback((silent: boolean) => {
    // Un selectId venu d'une notification déclenche déjà son propre chargement
    if (!silent && selectId) return;
    void loadIncidents(silent);
    reloadClusters();
  }, [loadIncidents, reloadClusters, selectId]);

  useAutoRefresh(refreshAll, {
    interval: POLL_INTERVAL_MS.incidents,
    failed: clustersFailed || incidentsFailed,
  });

  useFocusEffect(useCallback(() => () => { pendingSelectRef.current = null; }, []));

  // Garde le statut du signalement ouvert dans la fiche à jour avec le polling
  useEffect(() => {
    if (!selected) return;
    const updated = incidents.find((i) => i.id === selected.id);
    if (updated && updated.status !== selected.status) setSelected(updated);
  }, [incidents, selected]);

  // ── Markers ──
  // Les grappes viennent du serveur, qui ne connaît ni « les miens » ni les
  // suivis : dès qu'un de ces filtres est actif, on repasse aux épingles.
  const isClusterMode = currentZoom < CLUSTER_ZOOM_THRESHOLD && !mineOnly && !followedOnly;

  // Ne légender que les paliers réellement présents à l'écran : expliquer un
  // rouge que l'utilisateur n'a pas sous les yeux ne fait qu'encombrer.
  const visibleDensityTiers = useMemo(
    () => CLUSTER_DENSITY.filter((tier) => clusters.some((c) => c.count >= tier.min)),
    [clusters],
  );

  const notice: MapNoticeKind | null = useMemo(() => {
    if (loading) return null;
    const nothingToShow = isClusterMode ? clusters.length === 0 : visibleIncidents.length === 0;

    // Trois situations qui se ressemblaient sous un seul mot. « Hors ligne »
    // annonçait la panne même quand la carte, elle, montrait quelque chose —
    // le cache ou ce qui restait de la session. Elle ne l'annonce plus que
    // lorsqu'il n'y a réellement rien à voir ; sinon elle dit ce qui est vrai :
    // ce qui est affiché date.
    if (isClusterMode ? clustersFailed : incidentsFailed) {
      return nothingToShow ? "offline" : "stale";
    }
    if (isClusterMode ? clustersStale : incidentsStale) return "stale";

    if (!nothingToShow) return null;
    // « Les miens » et « suivis » comptent comme des filtres : ils vident
    // l'écran exactement de la même façon, et le panneau annonçait pourtant une
    // ville sans signalements.
    const filtering = Boolean(filterStatus || filterType || mineOnly || followedOnly);
    return filtering ? "filtered" : "empty";
  }, [
    loading, isClusterMode, clustersFailed, incidentsFailed, clustersStale, incidentsStale,
    clusters.length, visibleIncidents.length, filterStatus, filterType, mineOnly, followedOnly,
  ]);

  // Le résumé carte ne renvoie pas le type des signalements. Mais une cellule
  // qui n'en contient qu'un a pour centroïde ses coordonnées exactes : on le
  // retrouve donc dans la liste déjà chargée, ce qui permet d'afficher son
  // icône plutôt qu'une épingle muette. Tolérance ~1 m, le back arrondit les
  // centroïdes à la sixième décimale.
  const findIncidentAt = useCallback(
    (latitude: number, longitude: number) => incidents.find(
      (i) => Math.abs(i.latitude - latitude) < 1e-5 && Math.abs(i.longitude - longitude) < 1e-5,
    ),
    [incidents],
  );

  const clusterMarkers = useMemo(
    // Pas d'index dans la clé : le back itère un Dictionary, l'ordre du tableau
    // n'est pas garanti d'un appel à l'autre. Le centroïde identifie la cellule.
    // Le compteur y figure aussi car il pilote l'échelle de la pastille : un
    // changement de taille doit repartir sur un marker natif neuf, sinon Android
    // conserve le bitmap dimensionné pour l'ancienne.
    () => clusters.map((c) => (
      <ClusterMarker
        key={`cluster-${c.latitude}-${c.longitude}-${c.count}`}
        cluster={c}
        singleType={c.count <= 1 ? findIncidentAt(c.latitude, c.longitude)?.type : undefined}
        onPress={() => handleClusterPress(c)}
      />
    )),
    [clusters, handleClusterPress, findIncidentAt],
  );

  const individualMarkers = useMemo(
    () => visibleIncidents.map((inc) => (
      <IncidentMarker
        key={inc.id}
        incident={inc}
        color={MAP_STATUS_COLOR[inc.status] ?? colors.primary}
        active={selected?.id === inc.id}
        onPress={() => {
          markerJustPressed.current = true;
          selectIncident(inc);
          setTimeout(() => { markerJustPressed.current = false; }, MAP_ANIMATION_MS.markerPress);
        }}
      />
    )),
    [visibleIncidents, colors.primary, selected?.id, selectIncident],
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={userRegion ?? INITIAL_REGION}
        showsUserLocation
        onRegionChangeComplete={onRegionChangeComplete}
        onPress={() => { if (!markerJustPressed.current) setSelected(null); }}
      >
        {isClusterMode ? clusterMarkers : individualMarkers}
      </MapView>

      <View style={styles.filterBarOverlay}>
        <IncidentFilterBar
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterType={filterType}
          setFilterType={setFilterType}
          paddingTop={insets.top + FILTER_BAR_TOP}
          mineOnly={mineOnly}
          onToggleMine={dbUser ? () => setMineOnly((on) => !on) : undefined}
          followedOnly={followedOnly}
          onToggleFollowed={followed.size > 0 ? () => setFollowedOnly((on) => !on) : undefined}
        />
      </View>

      {/* Voile plein uniquement au tout premier chargement : ensuite il y a
          déjà quelque chose à l'écran, et le bouton rafraîchir porte son propre
          indicateur. Assombrir la carte à chaque retour sur l'onglet donnait un
          clignotement inutile. */}
      {loading && incidents.length === 0 && (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}

      {notice && !selected && (
        <MapNotice
          kind={notice}
          top={insets.top + FILTER_BAR_TOP + FILTER_BAR_HEIGHT}
          onRetry={notice === "offline" || notice === "stale" ? handleRefresh : undefined}
          /* Un filtre qui ne trouve rien n'a pas besoin d'un nouvel essai : il a
             besoin qu'on le retire. Le panneau le disait sans le proposer, et il
             fallait remonter les défaire un à un. */
          action={
            notice === "filtered"
              ? { label: t.mapNotice.clearFilters, onPress: clearFilters }
              : undefined
          }
        />
      )}

      {/* Les pastilles rouges n'existent qu'en mode groupé — la légende non plus */}
      {isClusterMode && !selected && (
        <ClusterLegend tiers={visibleDensityTiers} bottom={styles.fab.bottom} />
      )}

      <IncidentDetailSheet
        incident={selected}
        // La position vient d'ici, où elle est déjà connue — et seulement si
        // elle est réelle : le repli sur le centre-ville donnerait une distance
        // fausse que rien à l'écran ne démentirait.
        userPlace={knowsWhereWeAre ? userRegion : null}
        initialTab={initialTab}
        onClose={() => setSelected(null)}
        onStatusUpdated={(updated) => {
          setIncidents((prev) => prev.map((inc) => (inc.id === updated.id ? updated : inc)));
          setSelected(updated);
        }}
        onDeleted={() => {
          if (selected) setIncidents((prev) => prev.filter((inc) => inc.id !== selected.id));
          setSelected(null);
        }}
      />

      {/* ── Commandes de la carte ──
          Une colonne et non des boutons semés : ils sont deux aujourd'hui,
          trois demain, et chacun posé à sa propre distance du bord aurait fini
          en escalier. La pile se cale au-dessus du bouton de signalement, qui
          reste la seule action pleine de l'écran. */}
      {!selected && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.control}
            onPress={() => setPlaceSearch(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t.map.searchTitle}
          >
            <MaterialIcons name="search" size={22} color={colors.primary} />
          </TouchableOpacity>

          {/* Recentrer : la carte s'ouvre sur la position, mais dès qu'on l'a
              déplacée, y revenir demandait de faire glisser à l'aveugle.
              Absent quand la localisation est coupée — un bouton qui ne peut
              rien faire vaut moins qu'un bouton absent. */}
          {knowsWhereWeAre && (
            <TouchableOpacity
              style={styles.control}
              onPress={recenter}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t.map.recenter}
            >
              <MaterialIcons name="my-location" size={21} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <AddressSearch
        visible={placeSearch}
        onClose={() => setPlaceSearch(false)}
        near={currentRegionRef.current}
        onPick={(place) => {
          setPlaceSearch(false);
          mapRef.current?.animateToRegion(
            {
              latitude: place.latitude,
              longitude: place.longitude,
              latitudeDelta: MAP_DELTAS.explore,
              longitudeDelta: MAP_DELTAS.explore,
            },
            MAP_ANIMATION_MS.animateRegion,
          );
        }}
      />

      {!selected && canReportIncident && (
        <TouchableOpacity style={styles.fab} onPress={() => router.push("/report")} activeOpacity={0.85}>
          <MaterialIcons name={hasDraft ? "edit-note" : "add"} size={22} color="#fff" />
          <Text style={styles.fabLabel}>{hasDraft ? t.map.resume : t.map.report}</Text>
          {/* Pastille plutôt que libellé complet : le bouton flotte sur la carte,
              il ne peut pas s'allonger sans la manger. */}
          {hasDraft && <View style={styles.fabDot} />}
        </TouchableOpacity>
      )}
    </View>
  );
}

function makeStyles(c: AppColors, bottomInset: number) {
  return StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    loader: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: c.loaderOverlay,
    },
    filterBarOverlay: { position: "absolute", top: 0, left: 0, right: 0 },
    fab: {
      position: "absolute",
      bottom: 60 + bottomInset + (Platform.OS === "ios" ? 0 : 8) + 16,
      right: 24,
      backgroundColor: c.primary,
      borderRadius: 28,
      paddingHorizontal: 20,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 10,
      elevation: 6,
      gap: 8,
    },
    fabLabel: { fontSize: 15, fontWeight: "700", color: "#fff" },
    // La colonne se cale juste au-dessus du bouton de signalement, dont elle
    // reprend la marge droite : les commandes s'alignent sur un seul axe au lieu
    // de descendre en escalier à mesure qu'on en ajoute.
    controls: {
      position: "absolute",
      bottom: 60 + bottomInset + (Platform.OS === "ios" ? 0 : 8) + 16 + 62,
      right: 24,
      gap: 10,
      alignItems: "center",
    },
    // Ronds, blancs et de la taille d'un pouce : ces commandes ne disputent pas
    // la vedette au bouton de signalement, qui reste la seule action pleine.
    control: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.white,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.16,
      shadowRadius: 8,
      elevation: 5,
    },
    fabDot: {
      position: "absolute",
      top: 8,
      right: 10,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: "#fff",
      borderWidth: 2,
      borderColor: c.primary,
    },
  });
}
