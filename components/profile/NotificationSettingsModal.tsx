import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { PRIMARY, SUCCESS , DANGER, ROLE_COLOR } from "@/constants/theme";
import { ModalShell } from "@/components/ui/ModalShell";
import { MultiPillSelector } from "@/components/ui/MultiPillSelector";
import { TYPE_LABEL_SNAKE } from "@/constants/incidents";
import { STRINGS } from "@/constants/strings";
import { useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import { useNotificationSettings } from "@/hooks/use-notification-settings";
import { usePreferences } from "@/context/PreferencesContext";
import { NEARBY_RADII } from "@/storage/preferences";
import { formatDistance } from "@/utils/format-distance";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Switch, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/AppText";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function NotificationSettingsModal({ visible, onClose }: Props) {
  const { colors, isDark } = useAppColors();
  const t = useStrings();
  const { keycloakUser } = useAuth();
  const { settings, loadError, toggle, toggleType } = useNotificationSettings(visible);
  // Locale et non serveur : cette alerte-là est calculée par ce téléphone-ci.
  const { nearbyAlerts, setNearbyAlerts, nearbyRadiusKm, setNearbyRadiusKm } = usePreferences();

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
    errorText: { color: DANGER, fontSize: 13, textAlign: "center", marginVertical: 12 },
    radii: { flexDirection: "row", gap: 8, padding: 12 },
    radius: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 9,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: colors.chipBorder,
    },
    radiusLabel: { fontSize: 12.5, fontWeight: "600", color: colors.text },
    deviceHint: {
      fontSize: 11.5,
      color: colors.text,
      opacity: 0.5,
      lineHeight: 16,
      marginTop: -4,
      marginBottom: 4,
    },
  }), [colors, isDark]);

  const SectionHeader = ({ label, dim }: { label: string; dim?: boolean }) => (
    <View style={[s.sectionHeader, dim && { opacity: 0.5 }]}>
      <Text style={s.sectionLabel}>{label}</Text>
      <View style={s.sectionLine} />
    </View>
  );

  return (
    <ModalShell visible={visible} title={t.notifSettings.title} onClose={onClose}>
      {!settings && !loadError && (
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
      {loadError && <Text style={s.errorText}>{STRINGS.api.notifSettingsLoadError}</Text>}
      {settings && (
        <>
          <SectionHeader label={t.notifSettings.inApp} />
          <View style={s.group}>
            <View style={s.row}>
              <View style={[s.iconBubble, { backgroundColor: PRIMARY + "22" }]}>
                <MaterialIcons name="add-location-alt" size={20} color={PRIMARY} />
              </View>
              <View style={s.rowText}>
                <Text style={s.rowLabel}>{t.notifSettings.reports}</Text>
                <Text style={s.rowSub}>{t.notifSettings.reportsDetail}</Text>
              </View>
              <Switch
                value={settings.in_app_incidents_enabled}
                onValueChange={toggle("in_app_incidents_enabled")}
                trackColor={{ false: colors.secondary, true: PRIMARY + "70" }}
                thumbColor={settings.in_app_incidents_enabled ? PRIMARY : colors.text + "40"}
              />
            </View>
            <View style={s.divider} />
            <View style={s.row}>
              <View style={[s.iconBubble, { backgroundColor: SUCCESS + "22" }]}>
                <MaterialIcons name="chat-bubble" size={20} color={SUCCESS} />
              </View>
              <View style={s.rowText}>
                <Text style={s.rowLabel}>{t.notifSettings.messages}</Text>
                <Text style={s.rowSub}>{t.notifSettings.messagesDetail}</Text>
              </View>
              <Switch
                value={settings.in_app_messages_enabled}
                onValueChange={toggle("in_app_messages_enabled")}
                trackColor={{ false: colors.secondary, true: SUCCESS + "70" }}
                thumbColor={settings.in_app_messages_enabled ? SUCCESS : colors.text + "40"}
              />
            </View>
          </View>

          <SectionHeader label={t.notifSettings.push} />
          <View style={s.group}>
            <View style={s.row}>
              <View style={[s.iconBubble, { backgroundColor: ROLE_COLOR.admin + "22" }]}>
                <MaterialIcons name="notifications" size={20} color={ROLE_COLOR.admin} />
              </View>
              <View style={s.rowText}>
                <Text style={s.rowLabel}>{t.notifSettings.reports}</Text>
                <Text style={s.rowSub}>{t.notifSettings.reportsDetail}</Text>
              </View>
              <Switch
                value={settings.push_enabled}
                onValueChange={toggle("push_enabled")}
                trackColor={{ false: colors.secondary, true: ROLE_COLOR.admin + "70" }}
                thumbColor={settings.push_enabled ? ROLE_COLOR.admin : colors.text + "40"}
              />
            </View>
            <View style={s.divider} />
            <View style={s.row}>
              <View style={[s.iconBubble, { backgroundColor: ROLE_COLOR.admin + "22" }]}>
                <MaterialIcons name="notifications-active" size={20} color={ROLE_COLOR.admin} />
              </View>
              <View style={s.rowText}>
                <Text style={s.rowLabel}>{t.notifSettings.messages}</Text>
                <Text style={s.rowSub}>{t.notifSettings.messagesDetail}</Text>
              </View>
              <Switch
                value={settings.push_messages_enabled}
                onValueChange={toggle("push_messages_enabled")}
                trackColor={{ false: colors.secondary, true: ROLE_COLOR.admin + "70" }}
                thumbColor={settings.push_messages_enabled ? ROLE_COLOR.admin : colors.text + "40"}
              />
            </View>
          </View>

          <SectionHeader label={t.notifSettings.email} dim />
          <View style={[s.group, { opacity: 0.45 }]}>
            <View style={s.row}>
              <View style={[s.iconBubble, { backgroundColor: ROLE_COLOR.agent + "22" }]}>
                <MaterialIcons name="mail-outline" size={20} color={ROLE_COLOR.agent} />
              </View>
              <View style={s.rowText}>
                <Text style={s.rowLabel}>{t.notifSettings.emailNotifications}</Text>
              </View>
              <View style={s.comingSoonBadge}>
                <Text style={s.comingSoonText}>{t.notifSettings.soon}</Text>
              </View>
            </View>
          </View>

          {/* ── Sur cet appareil ──
              L'alerte de proximité vivait dans les réglages de l'application,
              au nom d'une règle défendable : elle décrit ce téléphone-ci, pas le
              compte. Sauf que personne ne cherche une notification en pensant
              « compte ou appareil » — on la cherche là où sont les
              notifications. Elle est donc affichée ici, tout en restant stockée
              localement, et la distinction est dite plutôt que devinée. */}
          <SectionHeader label={t.notifSettings.thisDevice} />
          <View style={s.group}>
            <View style={s.row}>
              <View style={[s.iconBubble, { backgroundColor: PRIMARY + "22" }]}>
                <MaterialIcons name="my-location" size={20} color={PRIMARY} />
              </View>
              <View style={s.rowText}>
                <Text style={s.rowLabel}>{t.settings.nearbyAlerts}</Text>
                <Text style={s.rowSub}>{t.settings.nearbyAlertsDetail}</Text>
              </View>
              <Switch
                value={nearbyAlerts}
                onValueChange={setNearbyAlerts}
                trackColor={{ false: colors.secondary, true: PRIMARY + "70" }}
                thumbColor={nearbyAlerts ? PRIMARY : colors.text + "40"}
              />
            </View>
            {nearbyAlerts && (
              <>
                <View style={s.divider} />
                <View style={s.radii}>
                  {NEARBY_RADII.map((km) => {
                    const active = nearbyRadiusKm === km;
                    return (
                      <TouchableOpacity
                        key={km}
                        style={[
                          s.radius,
                          active && { borderColor: colors.primary, backgroundColor: colors.primary + "14" },
                        ]}
                        onPress={() => setNearbyRadiusKm(km)}
                        activeOpacity={0.8}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                      >
                        <Text
                          style={[s.radiusLabel, active && { color: colors.primary, fontWeight: "800" }]}
                        >
                          {formatDistance(km, t.locale)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </View>
          {nearbyAlerts && <Text style={s.deviceHint}>{t.settings.nearbyLimit}</Text>}

          {isCitizen && (
            <>
              <SectionHeader label={t.notifSettings.followedTypes} />
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
