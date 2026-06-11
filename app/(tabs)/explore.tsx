import { IncidentFilterBar } from "@/components/incident-filter-bar";
import { formatIncidentDateTime } from "@/utils/format-date";
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
    getPhotos,
    updateIncidentStatus,
} from "@/services/incidents";
import { getValidToken } from "@/storage/tokens";
import type { IncidentResponse, PhotoResponse } from "@/types/incidents";
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
import ClusteredMapView from "react-native-map-clustering";
import MapView, { Marker, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
    const t = setTimeout(() => setTracksViewChanges(false), 600);
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
  longitude: number;
  latitude: number;
  count: number;
  color: string;
  onPress: () => void;
};

function ClusterMarker({ longitude, latitude, count, color, onPress }: ClusterMarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    const t = setTimeout(() => setTracksViewChanges(false), 600);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <Marker
      coordinate={{ longitude, latitude }}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={onPress}
    >
      <ClusterPin count={count} color={color} />
    </Marker>
  );
}

const LYON: Region = {
  latitude: 45.748,
  longitude: 4.847,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function SignalementsScreen() {
  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const { region: userRegion } = useUserLocation(0.05);
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

  const markerJustPressed = useRef(false);
  const mapRef = useRef<ClusteredMapView>(null);

  useEffect(() => {
    if (!selected) { setPhotos([]); return; }
    setPhotosLoading(true);
    getPhotos(selected.id)
      .then((data) => setPhotos(data ?? []))
      .catch((e) => { console.error("[photos]", e); setPhotos([]); })
      .finally(() => setPhotosLoading(false));
  }, [selected?.id]);

  const renderCluster = useCallback(
    ({ id, geometry, properties, onPress }: {
      id: number;
      geometry: { coordinates: [number, number] };
      properties: { point_count: number };
      onPress: () => void;
    }) => (
      <ClusterMarker
        key={`cluster-${id}`}
        longitude={geometry.coordinates[0]}
        latitude={geometry.coordinates[1]}
        count={properties.point_count}
        color={colors.primary}
        onPress={onPress}
      />
    ),
    [colors.primary],
  );

  const markers = useMemo(
    () =>
      filteredIncidents.map((inc) => {
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
              setTimeout(() => { markerJustPressed.current = false; }, 350);
            }}
          />
        );
      }),
    [filteredIncidents, colors.primary, selected?.id],
  );
  const { selectId } = useLocalSearchParams<{ selectId?: string }>();
  const pendingSelectRef = useRef<string | null>(null);

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

  const selectIncident = useCallback((inc: IncidentResponse) => {
    setSelected(inc);
    setTimeout(() => {
      (mapRef.current as unknown as MapView)?.animateToRegion(
        {
          latitude: inc.latitude - 0.002,
          longitude: inc.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        },
        800,
      );
    }, 400);
  }, []);

  // Quand selectId change, réinitialise et prépare la sélection
  useEffect(() => {
    if (!selectId) return;
    setSelected(null);
    pendingSelectRef.current = selectId;
    loadIncidents();
  }, [selectId, loadIncidents]);

  // Quand les incidents chargent, consomme le pending select
  useEffect(() => {
    if (!pendingSelectRef.current || incidents.length === 0) return;
    const inc = incidents.find((i) => i.id === pendingSelectRef.current);
    if (inc) {
      pendingSelectRef.current = null;
      selectIncident(inc);
    }
  }, [incidents, selectIncident]);

  // Rechargement à chaque focus (sans logique de sélection)
  useFocusEffect(
    useCallback(() => {
      if (!selectId) loadIncidents();
      return () => {
        pendingSelectRef.current = null;
      };
    }, [loadIncidents, selectId]),
  );

  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      if (!selected) return;
      setUpdatingStatus(true);
      try {
        const token = await getValidToken();
        if (!token) throw new Error(STRINGS.api.unauthenticated);
        await updateIncidentStatus(selected.id, newStatus, token);
        // Mise à jour locale immédiate
        const updated = { ...selected, status: newStatus } as IncidentResponse;
        setIncidents((prev) =>
          prev.map((inc) => (inc.id === selected.id ? updated : inc)),
        );
        setSelected(updated);
      } catch (e) {
        Alert.alert(
          STRINGS.alert.errorTitle,
          e instanceof Error ? e.message : STRINGS.api.unknownError,
        );
      } finally {
        setUpdatingStatus(false);
      }
    },
    [selected],
  );

  const handleDeletePhoto = useCallback(async (photoId: string) => {
    if (!selected) return;
    try {
      const token = await getValidToken();
      if (!token) return;
      await deletePhoto(selected.id, photoId, token);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (e) {
      Alert.alert(STRINGS.alert.errorTitle, e instanceof Error ? e.message : STRINGS.api.unknownError);
    }
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
              setIncidents((prev) =>
                prev.filter((inc) => inc.id !== selected.id),
              );
              setSelected(null);
            } catch (e) {
              Alert.alert(
                "Erreur",
                e instanceof Error ? e.message : STRINGS.api.unknownError,
              );
            }
          },
        },
      ],
    );
  }, [selected]);

  return (
    <View style={styles.container}>
      <ClusteredMapView
        ref={mapRef}
        style={styles.map}
        initialRegion={userRegion}
        showsUserLocation
        clusterColor={colors.primary}
        renderCluster={renderCluster}
        onPress={() => {
          if (!markerJustPressed.current) setSelected(null);
        }}
      >
        {markers}
      </ClusteredMapView>

      {/* Barre de filtres (overlay) */}
      <View style={styles.filterBarOverlay}>
        <IncidentFilterBar
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterType={filterType}
          setFilterType={setFilterType}
          onRefresh={loadIncidents}
          loading={loading}
          paddingTop={insets.top + 8}
        />
      </View>

      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}

      {/* Bottom sheet détail — via Modal pour passer au-dessus de la tab bar */}
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
                <View style={styles.sheetTitleRow}>
                  <Text style={styles.sheetType}>
                    {TYPE_LABEL[selected.type] ?? selected.type}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: STATUS_COLOR[selected.status] ?? "#999" },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {STATUS_LABEL[selected.status] ?? selected.status}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setSelected(null)}
                  style={styles.closeBtn}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Description */}
                <View style={styles.descBlock}>
                  <Text style={styles.sheetDesc}>{selected.description}</Text>
                </View>

                {/* Infos */}
                <View style={styles.infoCard}>
                  {selected.addressLabel ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Adresse</Text>
                      <Text style={styles.infoValue} numberOfLines={2}>
                        {selected.addressLabel}
                      </Text>
                    </View>
                  ) : null}
                  <View style={[styles.infoRow, styles.infoRowBorder]}>
                    <Text style={styles.infoLabel}>Signalé le</Text>
                    <Text style={styles.infoValue}>
                      {formatIncidentDateTime(selected.createdAt)}
                    </Text>
                  </View>
                  {selected.resolvedAt ? (
                    <View style={[styles.infoRow, styles.infoRowBorder]}>
                      <Text style={styles.infoLabel}>Résolu le</Text>
                      <Text
                        style={[
                          styles.infoValue,
                          { color: colors.statusGreen },
                        ]}
                      >
                        {formatIncidentDateTime(selected.resolvedAt)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Photos */}
                <View style={styles.photosSection}>
                  <Text style={styles.photosSectionLabel}>Photos</Text>
                  {photosLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : photos.length === 0 ? (
                    <Text style={styles.photosEmpty}>Aucune photo</Text>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {photos.map((p) => (
                        <View key={p.id} style={styles.photoThumb}>
                          <Image
                            source={{ uri: p.url }}
                            style={styles.photoImg}
                            contentFit="cover"
                          />
                          {(isStaff || dbUser?.id === selected?.authorUserId) && (
                            <TouchableOpacity
                              style={styles.photoDeleteBtn}
                              onPress={() => handleDeletePhoto(p.id)}
                            >
                              <Text style={styles.photoDeleteBtnText}>✕</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* Boutons statut — agents / admins */}
                {isStaff && NEXT_STATUSES[selected.status]?.length > 0 && (
                  <View style={styles.statusActions}>
                    <Text style={styles.statusActionsLabel}>Changer le statut</Text>
                    <View style={styles.statusActionsRow}>
                      {NEXT_STATUSES[selected.status].map((s) => (
                        <TouchableOpacity
                          key={s}
                          style={[
                            styles.statusActionBtn,
                            { backgroundColor: STATUS_COLOR[s] ?? "#999" },
                          ]}
                          onPress={() => handleStatusChange(s)}
                          disabled={updatingStatus}
                          activeOpacity={0.8}
                        >
                          {updatingStatus ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.statusActionBtnText}>
                              {STATUS_LABEL[s]}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Bouton suppression — admin uniquement */}
                {isAdmin && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={handleDelete}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.deleteBtnText}>
                      {STRINGS.alert.deleteIncidentTitle}
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* FAB Signaler — citoyens uniquement, masqué quand le sheet est ouvert */}
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
    modalContainer: {
      flex: 1,
      justifyContent: "flex-end",
    },
    modalDismiss: {
      flex: 1,
    },
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
      marginBottom: 14,
    },
    sheetHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
    sheetTitleRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
    },
    sheetType: { fontSize: 18, fontWeight: "800", color: c.text },
    statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    statusBadgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
    closeBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: c.secondary,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
    },
    closeBtnText: { fontSize: 13, color: c.text, fontWeight: "700" },
    descBlock: {
      backgroundColor: c.white,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderLeftWidth: 3,
      borderLeftColor: c.primary,
    },
    sheetDesc: { fontSize: 14, color: c.text, lineHeight: 21 },
    infoCard: { backgroundColor: c.white, borderRadius: 12, overflow: "hidden", marginBottom: 14 },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    infoRowBorder: { borderTopWidth: 1, borderTopColor: c.background },
    infoLabel: { fontSize: 13, color: c.text, opacity: 0.5, flex: 1 },
    infoValue: { fontSize: 13, color: c.text, fontWeight: "600", flex: 2, textAlign: "right" },
    statusActions: { marginBottom: 4 },
    statusActionsLabel: {
      fontSize: 11,
      color: c.text,
      opacity: 0.45,
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      fontWeight: "600",
    },
    statusActionsRow: { flexDirection: "row", gap: 10 },
    statusActionBtn: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    statusActionBtnText: { fontWeight: "700", fontSize: 14, color: "#fff" },
    deleteBtn: {
      marginTop: 12,
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: "center",
      backgroundColor: c.statusRed + "1a",
      borderWidth: 1,
      borderColor: c.statusRed,
    },
    deleteBtnText: { fontWeight: "700", fontSize: 14, color: c.statusRed },
    filterBarOverlay: { position: "absolute", top: 0, left: 0, right: 0 },
    photosSection: { marginBottom: 14 },
    photosSectionLabel: {
      fontSize: 11,
      color: c.text,
      opacity: 0.45,
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      fontWeight: "600",
    },
    photosEmpty: { fontSize: 13, color: c.text, opacity: 0.4, fontStyle: "italic" },
    photoThumb: {
      width: 88,
      height: 88,
      borderRadius: 10,
      overflow: "hidden",
      marginRight: 8,
    },
    photoImg: { width: 88, height: 88 },
    photoDeleteBtn: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "#000a",
      alignItems: "center",
      justifyContent: "center",
    },
    photoDeleteBtnText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  });
}
