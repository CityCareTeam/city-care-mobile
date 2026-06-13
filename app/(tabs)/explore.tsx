import { IncidentFilterBar } from "@/components/incident-filter-bar";
import { formatIncidentDateTime } from "@/utils/format-date";
import { CLUSTER_DEBOUNCE_MS, CLUSTER_ZOOM_THRESHOLD, DEFAULT_LOCATION, MAP_ANIMATION_MS, MAP_DELTAS } from "@/constants/config";
import {
    NEXT_STATUSES,
    STATUS_COLOR,
    STATUS_LABEL,
    TYPE_LABEL,
} from "@/constants/incidents";
import { useAuth } from "@/context/AuthContext";
import { STRINGS } from "@/constants/strings";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { useIncidentFilters } from "@/hooks/use-incident-filters";
import {
    deleteIncident,
    deletePhoto,
    getIncidents,
    getMapSummary,
    getPhotos,
    getStatusHistory,
    updateIncidentStatus,
} from "@/services/incidents";
import { getValidToken } from "@/storage/tokens";
import type { IncidentResponse, MapClusterDto, PhotoResponse, StatusHistoryEntry } from "@/types/incidents";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useUserLocation } from "@/hooks/use-user-location";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ClusterPin, MapPin } from "@/components/ui/MapPin";
import { Image } from "expo-image";
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

type IncidentMarkerProps = {
  incident: IncidentResponse;
  color: string;
  active: boolean;
  onPress: () => void;
};

function IncidentMarker({ incident, color, active, onPress }: IncidentMarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    const t = setTimeout(() => setTracksViewChanges(false), MAP_ANIMATION_MS.trackViewChange);
    return () => clearTimeout(t);
  }, [active, color]);

  return (
    <Marker
      coordinate={{ latitude: incident.latitude, longitude: incident.longitude }}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.5, y: 1 }}
      onPress={onPress}
    >
      <MapPin color={color} active={active} />
    </Marker>
  );
}

type ClusterMarkerProps = {
  cluster: MapClusterDto;
  onPress: () => void;
};

function ClusterMarker({ cluster, onPress }: ClusterMarkerProps) {
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
  const [clusters, setClusters] = useState<MapClusterDto[]>([]);
  const [currentZoom, setCurrentZoom] = useState(() => regionToZoom(MAP_DELTAS.explore));

  const { region: userRegion } = useUserLocation(MAP_DELTAS.user);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<IncidentResponse | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { isStaff, isAdmin, dbUser } = useAuth();
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, insets.bottom), [colors, insets.bottom]);
  const {
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filteredIncidents,
  } = useIncidentFilters(incidents);

  const [photos, setPhotos] = useState<PhotoResponse[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photosError, setPhotosError] = useState(false);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);

  const markerJustPressed = useRef(false);
  const mapRef = useRef<MapView>(null);
  const currentRegionRef = useRef<Region>(INITIAL_REGION);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Photos & history on selection ──
  useEffect(() => {
    if (!selected) { setPhotos([]); setStatusHistory([]); setPhotosError(false); return; }
    setPhotosLoading(true);
    setPhotosError(false);
    Promise.all([
      getPhotos(selected.id).catch(() => { setPhotosError(true); return []; }),
      getStatusHistory(selected.id).catch(() => []),
    ]).then(([p, h]) => {
      setPhotos(p);
      setStatusHistory(h);
    }).finally(() => setPhotosLoading(false));
  }, [selected?.id]);

  // ── Load clusters (server-side) ──
  const loadClusters = useCallback(async (
    region: Region,
    status: string | null,
    type: string | null,
  ) => {
    const zoom = regionToZoom(region.latitudeDelta);
    if (zoom >= CLUSTER_ZOOM_THRESHOLD) { setClusters([]); return; }

    const latMin = region.latitude - region.latitudeDelta / 2;
    const latMax = region.latitude + region.latitudeDelta / 2;
    const lngMin = region.longitude - region.longitudeDelta / 2;
    const lngMax = region.longitude + region.longitudeDelta / 2;

    try {
      const res = await getMapSummary({
        zoom,
        latMin, latMax, lngMin, lngMax,
        status: status ?? undefined,
        type: type ?? undefined,
      });
      setClusters(res.data);
    } catch {
      // silencieux — ne pas bloquer la carte
    }
  }, []);

  // ── Region change → debounced cluster reload ──
  const onRegionChangeComplete = useCallback((region: Region) => {
    currentRegionRef.current = region;
    const zoom = regionToZoom(region.latitudeDelta);
    setCurrentZoom(zoom);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void loadClusters(region, filterStatus, filterType);
    }, CLUSTER_DEBOUNCE_MS);
  }, [loadClusters, filterStatus, filterType]);

  // ── Reload clusters when filters change ──
  useEffect(() => {
    void loadClusters(currentRegionRef.current, filterStatus, filterType);
  }, [filterStatus, filterType, loadClusters]);

  // ── Load incidents (individual mode + selectId) ──
  const loadIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getIncidents();
      setIncidents(res.data);
    } catch {
      // réseau indisponible — liste vide
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    await loadIncidents();
    void loadClusters(currentRegionRef.current, filterStatus, filterType);
  }, [loadIncidents, loadClusters, filterStatus, filterType]);

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
      {
        latitude: cluster.latitude,
        longitude: cluster.longitude,
        latitudeDelta: delta,
        longitudeDelta: delta,
      },
      MAP_ANIMATION_MS.animateRegion,
    );
  }, [currentZoom]);

  // ── selectId (from notification) ──
  const { selectId } = useLocalSearchParams<{ selectId?: string }>();
  const pendingSelectRef = useRef<string | null>(null);

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
      selectIncident(inc);
    }
  }, [incidents, selectIncident]);

  useFocusEffect(
    useCallback(() => {
      if (!selectId) {
        loadIncidents();
        void loadClusters(currentRegionRef.current, filterStatus, filterType);
      }
      return () => { pendingSelectRef.current = null; };
    }, [loadIncidents, loadClusters, selectId, filterStatus, filterType]),
  );

  // ── Status change ──
  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      if (!selected) return;
      setUpdatingStatus(true);
      try {
        const token = await getValidToken();
        if (!token) throw new Error(STRINGS.api.unauthenticated);
        await updateIncidentStatus(selected.id, newStatus, token);
        const updated = { ...selected, status: newStatus } as IncidentResponse;
        setIncidents((prev) => prev.map((inc) => (inc.id === selected.id ? updated : inc)));
        setSelected(updated);
      } catch (e) {
        Alert.alert(STRINGS.alert.errorTitle, e instanceof Error ? e.message : STRINGS.api.unknownError);
      } finally {
        setUpdatingStatus(false);
      }
    },
    [selected],
  );

  const handleDeletePhoto = useCallback((photoId: string) => {
    if (!selected) return;
    Alert.alert(STRINGS.photos.deleteConfirmTitle, STRINGS.photos.deleteConfirmMsg, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await getValidToken();
            if (!token) return;
            await deletePhoto(selected.id, photoId, token);
            setPhotos((prev) => prev.filter((p) => p.id !== photoId));
          } catch {
            Alert.alert(STRINGS.alert.errorTitle, STRINGS.photos.deleteError);
          }
        },
      },
    ]);
  }, [selected]);

  const handleDelete = useCallback(() => {
    if (!selected) return;
    Alert.alert(
      STRINGS.alert.deleteIncidentTitle,
      STRINGS.alert.deleteIncidentMsg,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getValidToken();
              if (!token) throw new Error(STRINGS.api.unauthenticated);
              await deleteIncident(selected.id, token);
              setIncidents((prev) => prev.filter((inc) => inc.id !== selected.id));
              setSelected(null);
            } catch (e) {
              Alert.alert("Erreur", e instanceof Error ? e.message : STRINGS.api.unknownError);
            }
          },
        },
      ],
    );
  }, [selected]);

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
    () => filteredIncidents.map((inc) => {
      const isActive = selected?.id === inc.id;
      const color = STATUS_COLOR[inc.status] ?? colors.primary;
      return (
        <IncidentMarker
          key={inc.id}
          incident={inc}
          color={color}
          active={isActive}
          onPress={() => {
            markerJustPressed.current = true;
            setSelected(inc);
            setTimeout(() => { markerJustPressed.current = false; }, MAP_ANIMATION_MS.markerPress);
          }}
        />
      );
    }),
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
        onPress={() => {
          if (!markerJustPressed.current) setSelected(null);
        }}
      >
        {isClusterMode ? clusterMarkers : individualMarkers}
      </MapView>

      {/* Barre de filtres (overlay) */}
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

      {/* Bottom sheet détail */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalDismiss}
            activeOpacity={1}
            onPress={() => setSelected(null)}
          />
          {selected && (
            <View style={styles.sheet}>

              <View style={styles.sheetHandle} />

              {/* En-tête */}
              <View style={styles.sheetHeader}>
                <View style={styles.sheetTitleBlock}>
                  <Text style={styles.sheetType}>
                    {TYPE_LABEL[selected.type] ?? selected.type}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[selected.status] ?? "#999" }]}>
                    <Text style={styles.statusBadgeText}>
                      {STATUS_LABEL[selected.status] ?? selected.status}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelected(null)} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>

                {/* Timeline */}
                <View style={styles.timeline}>
                  {(["reported", "in_progress", "resolved"] as const).map((step, i, arr) => {
                    const isActive = selected.status === "resolved"
                      || (selected.status === "in_progress" && step !== "resolved")
                      || step === "reported";
                    const stepDate = step === "reported"
                      ? formatIncidentDateTime(selected.createdAt)
                      : step === "resolved" && selected.resolvedAt
                        ? formatIncidentDateTime(selected.resolvedAt)
                        : step === "in_progress"
                          ? (() => {
                              const e = statusHistory.find((h) => h.newStatus === "in_progress");
                              return e ? formatIncidentDateTime(e.changedAt) : null;
                            })()
                          : null;
                    const lineActive = i < arr.length - 1 && (
                      selected.status === "resolved"
                      || (selected.status === "in_progress" && i === 0)
                    );
                    return (
                      <View key={step} style={styles.timelineItem}>
                        <View style={styles.timelineTrack}>
                          <View style={[styles.timelineDot, isActive && { backgroundColor: STATUS_COLOR[step] ?? colors.primary }]} />
                          {i < arr.length - 1 && (
                            <View style={[styles.timelineLine, lineActive && styles.timelineLineActive]} />
                          )}
                        </View>
                        <View style={styles.timelineLabel}>
                          <Text style={[styles.timelineStepText, isActive && styles.timelineStepTextActive]}>
                            {STATUS_LABEL[step]}
                          </Text>
                          {stepDate && <Text style={styles.timelineDateText}>{stepDate}</Text>}
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Description */}
                <View style={styles.descBlock}>
                  <Text style={styles.sheetDesc}>{selected.description}</Text>
                </View>

                {/* Adresse */}
                {selected.addressLabel ? (
                  <View style={styles.addressRow}>
                    <Text style={styles.addressPin}>◎</Text>
                    <Text style={styles.addressText} numberOfLines={2}>{selected.addressLabel}</Text>
                  </View>
                ) : null}

                {/* Photos */}
                <View style={styles.photosSection}>
                  <Text style={styles.sectionLabel}>Photos</Text>
                  {photosLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : photosError ? (
                    <Text style={styles.photosEmpty}>{STRINGS.photos.loadError}</Text>
                  ) : photos.length === 0 ? (
                    <Text style={styles.photosEmpty}>Aucune photo jointe</Text>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {photos.map((p) => (
                        <View key={p.id} style={styles.photoThumb}>
                          <TouchableOpacity activeOpacity={0.85} onPress={() => setZoomedPhoto(p.url)}>
                            <Image source={{ uri: p.url }} style={styles.photoImg} contentFit="cover" />
                          </TouchableOpacity>
                          {(isAdmin || dbUser?.id === p.uploadedByUserId) && (
                            <TouchableOpacity style={styles.photoDeleteBtn} onPress={() => handleDeletePhoto(p.id)}>
                              <Text style={styles.photoDeleteBtnText}>✕</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* Boutons statut */}
                {isStaff && NEXT_STATUSES[selected.status]?.length > 0 && (
                  <View style={styles.statusActions}>
                    <Text style={styles.sectionLabel}>Changer le statut</Text>
                    <View style={styles.statusActionsRow}>
                      {NEXT_STATUSES[selected.status].map((s) => (
                        <TouchableOpacity
                          key={s}
                          style={[styles.statusActionBtn, { backgroundColor: STATUS_COLOR[s] ?? "#999" }]}
                          onPress={() => handleStatusChange(s)}
                          disabled={updatingStatus}
                          activeOpacity={0.8}
                        >
                          {updatingStatus ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.statusActionBtnText}>{STATUS_LABEL[s]}</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Suppression admin */}
                {isAdmin && (
                  <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
                    <Text style={styles.deleteBtnText}>{STRINGS.alert.deleteIncidentTitle}</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          )}

          {/* Visionneuse plein écran */}
          {zoomedPhoto && (
            <View style={styles.zoomOverlay}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setZoomedPhoto(null)}
              />
              <Image
                source={{ uri: zoomedPhoto }}
                style={styles.zoomImage}
                contentFit="contain"
              />
              <TouchableOpacity style={styles.zoomClose} onPress={() => setZoomedPhoto(null)}>
                <Text style={styles.zoomCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* FAB Signaler */}
      {!selected && !isStaff && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/report")}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>+</Text>
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
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
    fabIcon: { fontSize: 24, color: "#fff", fontWeight: "700", marginRight: 8 },
    fabLabel: { fontSize: 15, fontWeight: "700", color: "#fff" },
    modalContainer: { flex: 1, justifyContent: "flex-end" },
    modalDismiss: { flex: 1 },
    sheet: {
      backgroundColor: c.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingBottom: 36,
      paddingTop: 10,
      maxHeight: "62%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 20,
    },
    sheetHandle: {
      width: 44,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.secondary,
      alignSelf: "center",
      marginBottom: 16,
    },
    sheetHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
    sheetTitleBlock: { flex: 1, gap: 6 },
    sheetType: { fontSize: 20, fontWeight: "800", color: c.text },
    statusBadge: { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    statusBadgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
    closeBtn: {
      width: 30, height: 30, borderRadius: 15,
      backgroundColor: c.secondary,
      alignItems: "center", justifyContent: "center",
      marginLeft: 8,
    },
    closeBtnText: { fontSize: 13, color: c.text, fontWeight: "700" },
    timeline: {
      flexDirection: "row",
      backgroundColor: c.white,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
    },
    timelineItem: { flex: 1, alignItems: "center" },
    timelineTrack: { alignItems: "center", width: "100%" },
    timelineDot: {
      width: 14, height: 14, borderRadius: 7,
      backgroundColor: c.secondary,
      borderWidth: 2, borderColor: c.inputBorder,
      zIndex: 1,
    },
    timelineLine: {
      position: "absolute",
      top: 6, left: "50%", right: "-50%",
      height: 2,
      backgroundColor: c.inputBorder,
    },
    timelineLineActive: { backgroundColor: c.primary },
    timelineLabel: { alignItems: "center", marginTop: 8, gap: 2 },
    timelineStepText: { fontSize: 11, color: c.text, opacity: 0.4, fontWeight: "600", textAlign: "center" },
    timelineStepTextActive: { opacity: 1, color: c.text },
    timelineDateText: { fontSize: 10, color: c.text, opacity: 0.5, textAlign: "center" },
    descBlock: {
      backgroundColor: c.white, borderRadius: 12,
      padding: 14, marginBottom: 10,
      borderLeftWidth: 3, borderLeftColor: c.primary,
    },
    sheetDesc: { fontSize: 14, color: c.text, lineHeight: 21 },
    addressRow: {
      flexDirection: "row", alignItems: "flex-start",
      gap: 8, paddingHorizontal: 4, marginBottom: 14,
    },
    addressPin: { fontSize: 16, color: c.text, opacity: 0.4, marginTop: 1 },
    addressText: { flex: 1, fontSize: 13, color: c.text, opacity: 0.6, lineHeight: 18 },
    sectionLabel: {
      fontSize: 11, color: c.text, opacity: 0.45,
      marginBottom: 10, textTransform: "uppercase",
      letterSpacing: 0.6, fontWeight: "600",
    },
    photosSection: { marginBottom: 14 },
    photosEmpty: { fontSize: 13, color: c.text, opacity: 0.4, fontStyle: "italic" },
    photoThumb: { width: 96, height: 96, borderRadius: 12, overflow: "hidden", marginRight: 8 },
    photoImg: { width: 96, height: 96 },
    photoDeleteBtn: {
      position: "absolute", top: 4, right: 4,
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: "#000a",
      alignItems: "center", justifyContent: "center",
    },
    photoDeleteBtnText: { color: "#fff", fontSize: 10, fontWeight: "700" },
    statusActions: { marginBottom: 4 },
    statusActionsRow: { flexDirection: "row", gap: 10 },
    statusActionBtn: {
      flex: 1, borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center", justifyContent: "center",
    },
    statusActionBtnText: { fontWeight: "700", fontSize: 14, color: "#fff" },
    deleteBtn: {
      marginTop: 12, borderRadius: 12,
      paddingVertical: 13, alignItems: "center",
      backgroundColor: c.statusRed + "1a",
      borderWidth: 1, borderColor: c.statusRed,
    },
    deleteBtnText: { fontWeight: "700", fontSize: 14, color: c.statusRed },
    filterBarOverlay: { position: "absolute", top: 0, left: 0, right: 0 },
    zoomOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "#000d",
      alignItems: "center", justifyContent: "center",
      zIndex: 10,
    },
    zoomImage: { width: "100%", height: "80%" },
    zoomClose: {
      position: "absolute", top: 52, right: 20,
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: "#0008",
      alignItems: "center", justifyContent: "center",
    },
    zoomCloseText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  });
}
