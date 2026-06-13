import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ModalShell } from "@/components/ui/ModalShell";
import { MultiPillSelector } from "@/components/ui/MultiPillSelector";
import { TYPE_LABEL_SNAKE } from "@/constants/incidents";
import { STRINGS } from "@/constants/strings";
import { useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/use-app-colors";
import { useNotificationSettings } from "@/hooks/use-notification-settings";
import { ActivityIndicator, StyleSheet, Switch, Text, View } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function NotificationSettingsModal({ visible, onClose }: Props) {
  const { colors } = useAppColors();
  const { keycloakUser } = useAuth();
  const { settings, loadError, toggle, toggleType } = useNotificationSettings(visible);

  const isCitizen = keycloakUser?.mainRole === "Citizen";

  const s = StyleSheet.create({
    sectionLabel: {
      fontSize: 11, fontWeight: "700", letterSpacing: 0.7,
      textTransform: "uppercase", color: colors.text,
      opacity: 0.4, marginBottom: 6, marginTop: 20, marginLeft: 2,
    },
    group: {
      backgroundColor: colors.background,
      borderRadius: 14,
      overflow: "hidden",
      marginBottom: 4,
    },
    row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, gap: 12 },
    divider: { height: 1, backgroundColor: colors.secondary, marginLeft: 60 },
    iconBubble: {
      width: 36, height: 36, borderRadius: 10,
      alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    rowText: { flex: 1 },
    rowLabel: { fontSize: 15, fontWeight: "600", color: colors.text },
    rowSub: { fontSize: 12, color: colors.text, opacity: 0.4, marginTop: 2 },
    errorText: { color: "#e53e3e", fontSize: 13, textAlign: "center", marginVertical: 12 },
  });

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
          <Text style={s.sectionLabel}>In-app</Text>
          <View style={s.group}>
            <View style={s.row}>
              <View style={[s.iconBubble, { backgroundColor: "#f6aa5420" }]}>
                <MaterialIcons name="add-location-alt" size={18} color="#f6aa54" />
              </View>
              <View style={s.rowText}>
                <Text style={s.rowLabel}>Signalements</Text>
                <Text style={s.rowSub}>Nouveaux et changements de statut</Text>
              </View>
              <Switch
                value={settings.in_app_incidents_enabled}
                onValueChange={toggle("in_app_incidents_enabled")}
                trackColor={{ false: colors.secondary, true: "#f6aa5460" }}
                thumbColor={settings.in_app_incidents_enabled ? "#f6aa54" : colors.text + "40"}
              />
            </View>
            <View style={s.divider} />
            <View style={s.row}>
              <View style={[s.iconBubble, { backgroundColor: "#4caf5020" }]}>
                <MaterialIcons name="chat-bubble" size={18} color="#4caf50" />
              </View>
              <View style={s.rowText}>
                <Text style={s.rowLabel}>Messages</Text>
                <Text style={s.rowSub}>Nouveaux messages dans vos discussions</Text>
              </View>
              <Switch
                value={settings.in_app_messages_enabled}
                onValueChange={toggle("in_app_messages_enabled")}
                trackColor={{ false: colors.secondary, true: "#4caf5060" }}
                thumbColor={settings.in_app_messages_enabled ? "#4caf50" : colors.text + "40"}
              />
            </View>
          </View>

          <Text style={s.sectionLabel}>Push</Text>
          <View style={s.group}>
            <View style={s.row}>
              <View style={[s.iconBubble, { backgroundColor: "#AF52DE20" }]}>
                <MaterialIcons name="notifications" size={18} color="#AF52DE" />
              </View>
              <View style={s.rowText}>
                <Text style={s.rowLabel}>Signalements</Text>
                <Text style={s.rowSub}>Nouveaux et changements de statut</Text>
              </View>
              <Switch
                value={settings.push_enabled}
                onValueChange={toggle("push_enabled")}
                trackColor={{ false: colors.secondary, true: "#AF52DE60" }}
                thumbColor={settings.push_enabled ? "#AF52DE" : colors.text + "40"}
              />
            </View>
            <View style={s.divider} />
            <View style={s.row}>
              <View style={[s.iconBubble, { backgroundColor: "#AF52DE20" }]}>
                <MaterialIcons name="notifications-active" size={18} color="#AF52DE" />
              </View>
              <View style={s.rowText}>
                <Text style={s.rowLabel}>Messages</Text>
                <Text style={s.rowSub}>Nouveaux messages dans vos discussions</Text>
              </View>
              <Switch
                value={settings.push_messages_enabled}
                onValueChange={toggle("push_messages_enabled")}
                trackColor={{ false: colors.secondary, true: "#AF52DE60" }}
                thumbColor={settings.push_messages_enabled ? "#AF52DE" : colors.text + "40"}
              />
            </View>
          </View>

          <Text style={[s.sectionLabel, { opacity: 0.2 }]}>Email</Text>
          <View style={[s.group, { opacity: 0.4 }]}>
            <View style={s.row}>
              <View style={[s.iconBubble, { backgroundColor: "#1D9BF020" }]}>
                <MaterialIcons name="mail" size={18} color="#1D9BF0" />
              </View>
              <View style={s.rowText}>
                <Text style={s.rowLabel}>Email</Text>
                <Text style={s.rowSub}>Bientôt disponible</Text>
              </View>
              <Switch value={false} disabled trackColor={{ false: colors.secondary, true: colors.secondary }} thumbColor={colors.text + "30"} />
            </View>
          </View>

          {isCitizen && (
            <>
              <Text style={s.sectionLabel}>Types d&apos;incidents suivis</Text>
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
