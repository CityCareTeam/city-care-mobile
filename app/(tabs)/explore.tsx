import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { IncidentFilterBar } from "@/components/incident-filter-bar";
import { IncidentDetailSheet } from "@/components/explore/IncidentDetailSheet";
import { ClusterPin, MapPin } from "@/components/ui/MapPin";
import { CLUSTER_ZOOM_THRESHOLD, DEFAULT_LOCATION, MAP_ANIMATION_MS, MAP_DELTAS, POLL_INTERVAL_MS } from "@/constants/config";
import { STATUS_COLOR } from "@/constants/incidents";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { useIncidentFilters } from "@/hooks/use-incident-filters";
import { useIncidentPermissions } from "@/hooks/use-incident-permissions";
import { useMapClusters } from "@/hooks/use-map-clusters";
import { useUserLocation } from "@/hooks/use-user-location";
import { getIncidents } from "@/services/incidents";
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function regionToZoom(latitudeDelta: number): number {
  return Math.round(Math.log(360 / latitudeDelta) / Math.LN2);
}

function clusterDominantColor(c: MapClusterDto): string {
  if (c.in_progress > 0) return STATUS_COLOR.in_progress;
  if (c.reported > 0)    return STATUS_COLOR.reported;
  return STATUS_COLOR.resolved;
}

// ─── Markers ──────────────────────────────────────────────────────────────────

function IncidentMarker({ incident, color, active, onPress }: {
  incident: IncidentResponse;
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    const t = setTimeout(() => setTracksViewChanges(false), MAP_ANIMATION_MS.trackViewChange);
    return () => clearTimeout(t);
  }, [active, color]);

  return (
    <Marker
      coordinate={{ latitude: incident.latitude, longitude: incident.longitude }}
      tracksViewChanges={active || tracksViewChanges}
      anchor={{ x: 0.5, y: 1 }}
      onPress={onPress}
    >
      <MapPin color={color} active={active} />
    </Marker>
  );
}

function ClusterMarker({ cluster, onPress }: { cluster: MapClusterDto; onPress: () => void }) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    const t = setTimeout(() => setTracksViewChanges(false), MAP_ANIMATION_MS.trackViewChange);
    return () => clearTimeout(t);
  }, [cluster.count]);

  return (
    <Marker
      coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={onPress}
    >
      <ClusterPin count={cluster.count} color={clusterDominantColor(cluster)} />
    </Marker>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const INITIAL_REGION: Region = {
  ...DEFAULT_LOCATION,
  latitudeDelta: MAP_DELTAS.explore,
  longitudeDelta: MAP_DELTAS.explore,
};

export default function SignalementsScreen() {
  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<IncidentResponse | null>(null);
  const [initialTab, setInitialTab] = useState<"details" | "chat">("details");

  const { region: userRegion } = useUserLocation(MAP_DELTAS.user);
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, insets.bottom), [colors, insets.bottom]);
  const { canReportIncident } = useIncidentPermissions(null);
  const { filterType, setFilterType, filterStatus, setFilterStatus, filteredIncidents } = useIncidentFilters(incidents);
  const { clusters, currentZoom, currentRegionRef, onRegionChangeComplete, reload: reloadClusters } = useMapClusters(filterStatus, filterType);

  const mapRef = useRef<MapView>(null);
  const markerJustPressed = useRef(false);
  const pendingSelectRef = useRef<string | null>(null);

  // ── Load incidents ──
  const loadIncidents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getIncidents();
      setIncidents(res.data);
    } catch {
      // réseau indisponible — liste vide
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

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
  const handleClusterPress = useCallback((cluster: MapClusterDto) => {
    const newZoom = Math.min(currentZoom + 3, CLUSTER_ZOOM_THRESHOLD + 1);
    const delta = 360 / Math.pow(2, newZoom);
    mapRef.current?.animateToRegion(
      { latitude: cluster.latitude, longitude: cluster.longitude, latitudeDelta: delta, longitudeDelta: delta },
      MAP_ANIMATION_MS.animateRegion,
    );
  }, [currentZoom]);

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

  useFocusEffect(
    useCallback(() => {
      if (!selectId) {
        loadIncidents();
        reloadClusters();
      }
      const timer = setInterval(() => {
        void loadIncidents(true);
        reloadClusters();
      }, POLL_INTERVAL_MS.incidents);
      return () => {
        pendingSelectRef.current = null;
        clearInterval(timer);
      };
    }, [loadIncidents, reloadClusters, selectId]),
  );

  // Garde le statut du signalement ouvert dans la fiche à jour avec le polling
  useEffect(() => {
    if (!selected) return;
    const updated = incidents.find((i) => i.id === selected.id);
    if (updated && updated.status !== selected.status) setSelected(updated);
  }, [incidents, selected]);

  // ── Markers ──
  const isClusterMode = currentZoom < CLUSTER_ZOOM_THRESHOLD;

  const clusterMarkers = useMemo(
    () => clusters.map((c, i) => (
      <ClusterMarker
        key={`cluster-${i}-${c.latitude}-${c.longitude}`}
        cluster={c}
        onPress={() => handleClusterPress(c)}
      />
    )),
    [clusters, handleClusterPress],
  );

  const individualMarkers = useMemo(
    () => filteredIncidents.map((inc) => (
      <IncidentMarker
        key={inc.id}
        incident={inc}
        color={STATUS_COLOR[inc.status] ?? colors.primary}
        active={selected?.id === inc.id}
        onPress={() => {
          markerJustPressed.current = true;
          selectIncident(inc);
          setTimeout(() => { markerJustPressed.current = false; }, MAP_ANIMATION_MS.markerPress);
        }}
      />
    )),
    [filteredIncidents, colors.primary, selected?.id],
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
          onRefresh={handleRefresh}
          loading={loading}
          paddingTop={insets.top + 8}
        />
      </View>

      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}

      <IncidentDetailSheet
        incident={selected}
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

      {!selected && canReportIncident && (
        <TouchableOpacity style={styles.fab} onPress={() => router.push("/report")} activeOpacity={0.85}>
          <MaterialIcons name="add" size={22} color="#fff" />
          <Text style={styles.fabLabel}>Signaler</Text>
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
  });
}
