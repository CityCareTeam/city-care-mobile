import { IncidentChatTab } from "@/components/explore/IncidentChatTab";
import { PhotoViewer } from "@/components/explore/PhotoViewer";
import {
  NEXT_STATUSES,
  STATUS_COLOR,
  STATUS_LABEL,
  TYPE_COLOR,
  TYPE_ICON,
  TYPE_LABEL,
} from "@/constants/incidents";
import { STRINGS } from "@/constants/strings";
import { useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/use-app-colors";
import { useIncidentChat } from "@/hooks/use-incident-chat";
import { useIncidentPermissions } from "@/hooks/use-incident-permissions";
import { useIncidentPhotos } from "@/hooks/use-incident-photos";
import { useIncidentVotes } from "@/hooks/use-incident-votes";
import { updateIncidentStatus } from "@/services/incidents";
import { getValidToken } from "@/storage/tokens";
import type { IncidentResponse } from "@/types/incidents";
import { formatIncidentDateTime } from "@/utils/format-date";
import { GlassPillSelector } from "@/components/ui/GlassPillSelector";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";


type Props = {
  incident: IncidentResponse | null;
  initialTab?: "details" | "chat";
  onClose: () => void;
  onStatusUpdated: (updated: IncidentResponse) => void;
  onDeleted: () => void;
};

export function IncidentDetailSheet({ incident, initialTab, onClose, onStatusUpdated, onDeleted }: Props) {
  const { colors } = useAppColors();
  const { dbUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"details" | "chat">("details");
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [sending, setSending] = useState(false);

  const { canAccessChat, canChangeStatus, canDeleteIncident, canDeletePhoto, canVote } = useIncidentPermissions(incident);
  const { photos, photosLoading, photosError, statusHistory, handleDeletePhoto } = useIncidentPhotos(incident?.id ?? null);
  const { votes, toggling, toggleVote } = useIncidentVotes(incident?.id ?? null);
  const { messages, send, connected, loading: chatLoading } = useIncidentChat(
    activeTab === "chat" ? (incident?.id ?? null) : null
  );

  useEffect(() => {
    setActiveTab(initialTab ?? "details");
  }, [incident?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async (newStatus: string) => {
    if (!incident) return;
    setUpdatingStatus(true);
    try {
      const token = await getValidToken();
      if (!token) throw new Error(STRINGS.api.unauthenticated);
      await updateIncidentStatus(incident.id, newStatus, token);
      onStatusUpdated({ ...incident, status: newStatus } as IncidentResponse);
    } catch (e) {
      Alert.alert(STRINGS.alert.errorTitle, e instanceof Error ? e.message : STRINGS.api.unknownError);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = () => {
    if (!incident) return;
    Alert.alert(STRINGS.alert.deleteIncidentTitle, STRINGS.alert.deleteIncidentMsg, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await getValidToken();
            if (!token) throw new Error(STRINGS.api.unauthenticated);
            const { deleteIncident } = await import("@/services/incidents");
            await deleteIncident(incident.id, token);
            onDeleted();
          } catch (e) {
            Alert.alert("Erreur", e instanceof Error ? e.message : STRINGS.api.unknownError);
          }
        },
      },
    ]);
  };

  const handleSend = async (text: string) => {
    setSending(true);
    try { await send(text); }
    catch { /* silent */ }
    finally { setSending(false); }
  };

  const s = StyleSheet.create({
    modalContainer: { flex: 1, justifyContent: "flex-end" },
    dismiss: { flex: 1 },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 10,
      height: "62%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 20,
    },
    handle: {
      width: 44, height: 4, borderRadius: 2,
      backgroundColor: colors.secondary,
      alignSelf: "center", marginBottom: 16,
    },
    header: { flexDirection: "row", alignItems: "center", marginBottom: 16, paddingHorizontal: 20, gap: 12 },
    titleBlock: { flex: 1, gap: 6 },
    typeIconBubble: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    type: { fontSize: 20, fontWeight: "800", color: colors.text },
    statusBadge: { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    statusBadgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
    closeBtn: {
      width: 30, height: 30, borderRadius: 15,
      backgroundColor: colors.secondary,
      alignItems: "center", justifyContent: "center",
    },
    // ── Détails ──
    timeline: {
      flexDirection: "row",
      backgroundColor: colors.white, borderRadius: 14, padding: 16, marginBottom: 12,
    },
    timelineItem: { flex: 1, alignItems: "center" },
    timelineTrack: { alignItems: "center", width: "100%" },
    timelineDot: {
      width: 14, height: 14, borderRadius: 7,
      backgroundColor: colors.secondary,
      borderWidth: 2, borderColor: colors.inputBorder, zIndex: 1,
    },
    timelineLine: {
      position: "absolute", top: 6, left: "50%", right: "-50%",
      height: 2, backgroundColor: colors.inputBorder,
    },
    timelineLineActive: { backgroundColor: colors.primary },
    timelineLabel: { alignItems: "center", marginTop: 8, gap: 2 },
    timelineStepText: { fontSize: 11, color: colors.text, opacity: 0.4, fontWeight: "600", textAlign: "center" },
    timelineStepTextActive: { opacity: 1, color: colors.text },
    timelineDateText: { fontSize: 10, color: colors.text, opacity: 0.5, textAlign: "center" },
    descBlock: {
      backgroundColor: colors.white, borderRadius: 12,
      padding: 14, marginBottom: 10,
      borderLeftWidth: 3, borderLeftColor: colors.primary,
    },
    desc: { fontSize: 14, color: colors.text, lineHeight: 21 },
    addressRow: {
      flexDirection: "row", alignItems: "flex-start",
      gap: 8, paddingHorizontal: 4, marginBottom: 14,
    },
    addressText: { flex: 1, fontSize: 13, color: colors.text, opacity: 0.6, lineHeight: 18 },
    sectionLabel: {
      fontSize: 11, color: colors.text, opacity: 0.45,
      marginBottom: 10, textTransform: "uppercase",
      letterSpacing: 0.6, fontWeight: "600",
    },
    voteBtn: {
      flexDirection: "row", alignItems: "center", gap: 4,
      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
      borderWidth: 1, borderColor: colors.inputBorder,
    },
    voteBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary + "18" },
    voteBtnCount: { fontSize: 13, fontWeight: "700", color: colors.text, opacity: 0.55 },
    photosSection: { marginBottom: 14 },
    photosEmpty: { fontSize: 13, color: colors.text, opacity: 0.4, fontStyle: "italic" },
    photoThumb: { width: 96, height: 96, borderRadius: 12, overflow: "hidden", marginRight: 8 },
    photoImg: { width: 96, height: 96 },
    photoDeleteBtn: {
      position: "absolute", top: 4, right: 4,
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: "#000a",
      alignItems: "center", justifyContent: "center",
    },
    statusActions: { marginBottom: 4 },
    statusActionsRow: { flexDirection: "row", gap: 10 },
    statusActionBtn: {
      flex: 1, borderRadius: 12, paddingVertical: 12,
      alignItems: "center", justifyContent: "center",
    },
    statusActionBtnText: { fontWeight: "700", fontSize: 14, color: "#fff" },
    deleteBtn: {
      marginTop: 12, borderRadius: 12, paddingVertical: 13, alignItems: "center",
      backgroundColor: colors.statusRed + "1a",
      borderWidth: 1, borderColor: colors.statusRed,
    },
    deleteBtnText: { fontWeight: "700", fontSize: 14, color: colors.statusRed },
  });

  return (
    <Modal
      visible={!!incident}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView style={s.modalContainer} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableOpacity style={s.dismiss} activeOpacity={1} onPress={onClose} />
        {incident && (
          <View style={s.sheet}>
            <View style={s.handle} />

            {/* En-tête */}
            <View style={s.header}>
              <View style={[s.typeIconBubble, { backgroundColor: (TYPE_COLOR[incident.type] ?? "#78909C") + "22" }]}>
                <MaterialIcons name={TYPE_ICON[incident.type] ?? "help-outline"} size={22} color={TYPE_COLOR[incident.type] ?? "#78909C"} />
              </View>
              <View style={s.titleBlock}>
                <Text style={s.type}>{TYPE_LABEL[incident.type] ?? incident.type}</Text>
                <View style={[s.statusBadge, { backgroundColor: STATUS_COLOR[incident.status] ?? "#999" }]}>
                  <Text style={s.statusBadgeText}>{STATUS_LABEL[incident.status] ?? incident.status}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[s.voteBtn, votes?.hasVoted && s.voteBtnActive, toggling && { opacity: 0.5 }]}
                onPress={toggleVote}
                disabled={!canVote || toggling}
                activeOpacity={0.75}
              >
                <MaterialIcons
                  name={votes?.hasVoted ? "thumb-up" : "thumb-up-off-alt"}
                  size={15}
                  color={votes?.hasVoted ? colors.primary : colors.text}
                  style={{ opacity: canVote ? 1 : 0.3 }}
                />
                <Text style={[s.voteBtnCount, votes?.hasVoted && { color: colors.primary, opacity: 1 }]}>
                  {votes?.voteCount ?? 0}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={[s.closeBtn, { marginLeft: 10 }]}>
                <MaterialIcons name="close" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            {canAccessChat && (
              <GlassPillSelector
                options={[
                  { label: "Détails",    value: "details" as const },
                  { label: "Discussion", value: "chat"    as const, dotColor: connected ? "#4caf50" : "#e53e3e" },
                ]}
                activeValue={activeTab}
                onSelect={(v) => setActiveTab(v)}
                style={{ marginHorizontal: 20, marginBottom: 4 }}
              />
            )}

            {/* Détails */}
            {activeTab === "details" && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 36 }}>
                {/* Timeline */}
                <View style={s.timeline}>
                  {(["reported", "in_progress", "resolved"] as const).map((step, i, arr) => {
                    const isActive = incident.status === "resolved"
                      || (incident.status === "in_progress" && step !== "resolved")
                      || step === "reported";
                    const stepDate = step === "reported"
                      ? formatIncidentDateTime(incident.createdAt)
                      : step === "resolved" && incident.resolvedAt
                        ? formatIncidentDateTime(incident.resolvedAt)
                        : step === "in_progress"
                          ? (() => { const e = statusHistory.find(h => h.newStatus === "in_progress"); return e ? formatIncidentDateTime(e.changedAt) : null; })()
                          : null;
                    const lineActive = i < arr.length - 1 && (
                      incident.status === "resolved" || (incident.status === "in_progress" && i === 0)
                    );
                    return (
                      <View key={step} style={s.timelineItem}>
                        <View style={s.timelineTrack}>
                          <View style={[s.timelineDot, isActive && { backgroundColor: STATUS_COLOR[step] ?? colors.primary }]} />
                          {i < arr.length - 1 && (
                            <View style={[s.timelineLine, lineActive && s.timelineLineActive]} />
                          )}
                        </View>
                        <View style={s.timelineLabel}>
                          <Text style={[s.timelineStepText, isActive && s.timelineStepTextActive]}>{STATUS_LABEL[step]}</Text>
                          {stepDate && <Text style={s.timelineDateText}>{stepDate}</Text>}
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Description */}
                <View style={s.descBlock}>
                  <Text style={s.desc}>{incident.description}</Text>
                </View>

                {/* Adresse */}
                {incident.addressLabel && (
                  <View style={s.addressRow}>
                    <MaterialIcons name="location-on" size={16} color={colors.text} style={{ opacity: 0.4, marginTop: 1 }} />
                    <Text style={s.addressText} numberOfLines={2}>{incident.addressLabel}</Text>
                  </View>
                )}

                {/* Photos */}
                <View style={s.photosSection}>
                  <Text style={s.sectionLabel}>Photos</Text>
                  {photosLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : photosError ? (
                    <Text style={s.photosEmpty}>{STRINGS.photos.loadError}</Text>
                  ) : photos.length === 0 ? (
                    <Text style={s.photosEmpty}>Aucune photo jointe</Text>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {photos.map((p) => (
                        <View key={p.id} style={s.photoThumb}>
                          <TouchableOpacity activeOpacity={0.85} onPress={() => setZoomedPhoto(p.url)}>
                            <Image source={{ uri: p.url }} style={s.photoImg} contentFit="cover" />
                          </TouchableOpacity>
                          {canDeletePhoto(p) && (
                            <TouchableOpacity style={s.photoDeleteBtn} onPress={() => handleDeletePhoto(p.id)}>
                              <MaterialIcons name="close" size={12} color="#fff" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* Boutons statut */}
                {canChangeStatus && NEXT_STATUSES[incident.status]?.length > 0 && (
                  <View style={s.statusActions}>
                    <Text style={s.sectionLabel}>Changer le statut</Text>
                    <View style={s.statusActionsRow}>
                      {NEXT_STATUSES[incident.status].map((nextStatus) => (
                        <TouchableOpacity
                          key={nextStatus}
                          style={[s.statusActionBtn, { backgroundColor: STATUS_COLOR[nextStatus] ?? "#999" }]}
                          onPress={() => handleStatusChange(nextStatus)}
                          disabled={updatingStatus}
                          activeOpacity={0.8}
                        >
                          {updatingStatus
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Text style={s.statusActionBtnText}>{STATUS_LABEL[nextStatus]}</Text>
                          }
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Suppression */}
                {canDeleteIncident && (
                  <TouchableOpacity style={s.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
                    <Text style={s.deleteBtnText}>{STRINGS.alert.deleteIncidentTitle}</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}

            {/* Chat */}
            {activeTab === "chat" && (
              <IncidentChatTab
                messages={messages}
                loading={chatLoading}
                connected={connected}
                sending={sending}
                dbUserId={dbUser?.id}
                onSend={handleSend}
              />
            )}
          </View>
        )}

        <PhotoViewer uri={zoomedPhoto} onClose={() => setZoomedPhoto(null)} />
      </KeyboardAvoidingView>
    </Modal>
  );
}
