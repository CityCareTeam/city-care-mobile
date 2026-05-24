import { IncidentFilterBar } from "@/components/incident-filter-bar";
import { formatIncidentDateTime } from "@/utils/format-date";
import {
    NEXT_STATUSES,
    STATUS_COLOR,
    STATUS_LABEL,
    TYPE_LABEL,
} from "@/constants/incidents";
import { CityCareColors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { STRINGS } from "@/constants/strings";
import { useIncidentFilters } from "@/hooks/use-incident-filters";
import {
    deleteIncident,
    getIncidents,
    updateIncidentStatus,
} from "@/services/incidents";
import { getValidToken } from "@/storage/tokens";
import type { IncidentResponse } from "@/types/incidents";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LYON: Region = {
  latitude: 45.748,
  longitude: 4.847,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function SignalementsScreen() {
  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<IncidentResponse | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { isStaff, isAdmin } = useAuth();
  const insets = useSafeAreaInsets();
  const {
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filteredIncidents,
  } = useIncidentFilters(incidents);

  const markerJustPressed = useRef(false);
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

  // Auto-sélection depuis le dashboard
  useEffect(() => {
    if (!pendingSelectRef.current || incidents.length === 0) return;
    const inc = incidents.find((i) => i.id === pendingSelectRef.current);
    if (inc) {
      setSelected(inc);
      pendingSelectRef.current = null;
    }
  }, [incidents]);

  useFocusEffect(
    useCallback(() => {
      if (selectId) pendingSelectRef.current = selectId;
      loadIncidents();
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
      <MapView
        style={styles.map}
        initialRegion={LYON}
        showsUserLocation
        onPress={() => {
          if (!markerJustPressed.current) setSelected(null);
        }}
      >
        {filteredIncidents.map((inc) => (
          <Marker
            key={inc.id}
            coordinate={{ latitude: inc.latitude, longitude: inc.longitude }}
            pinColor={STATUS_COLOR[inc.status] ?? CityCareColors.primary}
            tracksViewChanges={false}
            onPress={() => {
              markerJustPressed.current = true;
              setSelected(inc);
              setTimeout(() => {
                markerJustPressed.current = false;
              }, 350);
            }}
          />
        ))}
      </MapView>

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
          <ActivityIndicator color={CityCareColors.primary} size="large" />
        </View>
      )}

      {/* Bottom sheet détail */}
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
                      { color: CityCareColors.statusGreen },
                    ]}
                  >
                    {formatIncidentDateTime(selected.resolvedAt)}
                  </Text>
                </View>
              ) : null}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(249,247,233,0.6)",
  },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    backgroundColor: CityCareColors.primary,
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
  // Bottom sheet
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: CityCareColors.background,
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
    elevation: 12,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: CityCareColors.secondary,
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  sheetTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  sheetType: {
    fontSize: 18,
    fontWeight: "800",
    color: CityCareColors.text,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: CityCareColors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  closeBtnText: { fontSize: 13, color: CityCareColors.text, fontWeight: "700" },
  descBlock: {
    backgroundColor: CityCareColors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: CityCareColors.primary,
  },
  sheetDesc: {
    fontSize: 14,
    color: CityCareColors.text,
    lineHeight: 21,
  },
  infoCard: {
    backgroundColor: CityCareColors.white,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  infoRowBorder: {
    borderTopWidth: 1,
    borderTopColor: CityCareColors.background,
  },
  infoLabel: {
    fontSize: 13,
    color: CityCareColors.text,
    opacity: 0.5,
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    color: CityCareColors.text,
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
  },
  // Status actions (agent/admin)
  statusActions: {
    marginBottom: 4,
  },
  statusActionsLabel: {
    fontSize: 11,
    color: CityCareColors.text,
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
    backgroundColor: "#fdecea",
    borderWidth: 1,
    borderColor: CityCareColors.statusRed,
  },
  deleteBtnText: {
    fontWeight: "700",
    fontSize: 14,
    color: CityCareColors.statusRed,
  },
  filterBarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
});
