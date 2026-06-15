import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ModalShell } from "@/components/ui/ModalShell";
import { MultiPillSelector } from "@/components/ui/MultiPillSelector";
import { TYPE_LABEL_SNAKE } from "@/constants/incidents";
import { STRINGS } from "@/constants/strings";
import { useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/use-app-colors";
import { useNotificationSettings } from "@/hooks/use-notification-settings";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Switch, Text, View } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function NotificationSettingsModal({ visible, onClose }: Props) {
  const { colors, isDark } = useAppColors();
  const { keycloakUser } = useAuth();
  const { settings, loadError, toggle, toggleType } = useNotificationSettings(visible);

  const isCitizen = keycloakUser?.mainRole === "Citizen";

  const s = useMemo(() => StyleSheet.create({
    sectionHeader: {
      flexDirection: "row", alignItems: "center",
      marginBottom: 8, marginTop: 22, marginLeft: 2, gap: 8,
    },
    sectionLabel: {
      fontSize: 11, fontWeight: "700", letterSpacing: 0.8,
      textTransform: "uppercase", color: colors.text, opacity: 0.4,
    },
    sectionLine: {
      flex: 1, height: StyleSheet.hairlineWidth,
      backgroundColor: colors.text, opacity: 0.15,
    },
    group: {
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    },
    row: { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 14, gap: 12 },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
      marginLeft: 62,
    },
    iconBubble: {
      width: 38, height: 38, borderRadius: 12,
      alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    rowText: { flex: 1 },
    rowLabel: { fontSize: 15, fontWeight: "600", color: colors.text },
    rowSub: { fontSize: 12, color: colors.text, opacity: 0.4, marginTop: 1 },
    comingSoonBadge: {
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    },
    comingSoonText: { fontSize: 10, fontWeight: "700", color: colors.text, opacity: 0.4, letterSpacing: 0.3 },
    errorText: { color: "#e53e3e", fontSize: 13, textAlign: "center", marginVertical: 12 },
  }), [colors, isDark]);

  const SectionHeader = ({ label, dim }: { label: string; dim?: boolean }) => (
    <View style={[s.sectionHeader, dim && { opacity: 0.5 }]}>
      <Text style={s.sectionLabel}>{label}</Text>
      <View style={s.sectionLine} />
    </View>
  );

  return (
    <ModalShell visible={visible} title="Notifications" onClose={onClose}>
      {!settings && !loadError && (
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
      {loadError && <Text style={s.errorText}>{STRINGS.api.notifSettingsLoadError}</Text>}
      {settings && (
        <>
          <SectionHeader label="In-app" />
          <View style={s.group}>
            <View style={s.row}>
              <View style={[s.iconBubble, { backgroundColor: "#f6aa5422" }]}>
                <MaterialIcons name="add-location-alt" size={20} color="#f6aa54" />
              </View>
              <View style={s.rowText}>
                <Text style={s.rowLabel}>Signalements</Text>
                <Text style={s.rowSub}>Nouveaux et changements de statut</Text>
              </View>
              <Switch
                value={settings.in_app_incidents_enabled}
                onValueChange={toggle("in_app_incidents_enabled")}
                trackColor={{ false: colors.secondary, true: "#f6aa5470" }}
                thumbColor={settings.in_app_incidents_enabled ? "#f6aa54" : colors.text + "40"}
              />
            </View>
            <View style={s.divider} />
            <View style={s.row}>
              <View style={[s.iconBubble, { backgroundColor: "#4caf5022" }]}>
                <MaterialIcons name="chat-bubble" size={20} color="#4caf50" />
              </View>
              <View style={s.rowText}>
                <Text style={s.rowLabel}>Messages</Text>
                <Text style={s.rowSub}>Nouvelles discussions</Text>
              </View>
              <Switch
                value={settings.in_app_messages_enabled}
                onValueChange={toggle("in_app_messages_enabled")}
                trackColor={{ false: colors.secondary, true: "#4caf5070" }}
                thumbColor={settings.in_app_messages_enabled ? "#4caf50" : colors.text + "40"}
              />
            </View>
          </View>

          <SectionHeader label="Push" />
          <View style={s.group}>
            <View style={s.row}>
              <View style={[s.iconBubble, { backgroundColor: "#AF52DE22" }]}>
                <MaterialIcons name="notifications" size={20} color="#AF52DE" />
              </View>
              <View style={s.rowText}>
                <Text style={s.rowLabel}>Signalements</Text>
                <Text style={s.rowSub}>Nouveaux et changements de statut</Text>
              </View>
              <Switch
                value={settings.push_enabled}
                onValueChange={toggle("push_enabled")}
                trackColor={{ false: colors.secondary, true: "#AF52DE70" }}
                thumbColor={settings.push_enabled ? "#AF52DE" : colors.text + "40"}
              />
            </View>
            <View style={s.divider} />
            <View style={s.row}>
              <View style={[s.iconBubble, { backgroundColor: "#AF52DE22" }]}>
                <MaterialIcons name="notifications-active" size={20} color="#AF52DE" />
              </View>
              <View style={s.rowText}>
                <Text style={s.rowLabel}>Messages</Text>
                <Text style={s.rowSub}>Nouvelles discussions</Text>
              </View>
              <Switch
                value={settings.push_messages_enabled}
                onValueChange={toggle("push_messages_enabled")}
                trackColor={{ false: colors.secondary, true: "#AF52DE70" }}
                thumbColor={settings.push_messages_enabled ? "#AF52DE" : colors.text + "40"}
              />
            </View>
          </View>

          <SectionHeader label="Email" dim />
          <View style={[s.group, { opacity: 0.45 }]}>
            <View style={s.row}>
              <View style={[s.iconBubble, { backgroundColor: "#1D9BF022" }]}>
                <MaterialIcons name="mail-outline" size={20} color="#1D9BF0" />
              </View>
              <View style={s.rowText}>
                <Text style={s.rowLabel}>Notifications par email</Text>
              </View>
              <View style={s.comingSoonBadge}>
                <Text style={s.comingSoonText}>Bientôt</Text>
              </View>
            </View>
          </View>

          {isCitizen && (
            <>
              <SectionHeader label="Types d'incidents suivis" />
              <MultiPillSelector
                options={Object.entries(TYPE_LABEL_SNAKE).map(([value, label]) => ({ value, label }))}
                selectedValues={settings.followed_incident_types}
                onToggle={toggleType}
              />
            </>
          )}
        </>
      )}
    </ModalShell>
  );
}
