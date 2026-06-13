import MaterialIcons from "@expo/vector-icons/MaterialIcons"; // empty state icon
import { useNotificationContext } from "@/context/NotificationContext";
import { getTabBarScrollPadding } from "@/utils/layout";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { STRINGS } from "@/constants/strings";
import { STATUS_COLOR, STATUS_LABEL } from "@/constants/incidents";
import { getNotifications, markAllAsRead, markAsRead } from "@/services/notifications";
import { getValidToken } from "@/storage/tokens";
import type { NotificationResponse } from "@/types/notifications";
import { timeAgo } from "@/utils/format-date";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";

// ─── Icon par type de notif ───────────────────────────────────────────────────

type NotifIconConfig = {
  name: React.ComponentProps<typeof MaterialIcons>["name"];
  bg: string;
  color: string;
};

function getIconConfig(type: string): NotifIconConfig {
  switch (type) {
    case "new_incident":
      return { name: "add-location-alt", bg: "#f6aa5420", color: "#f6aa54" };
    case "status_change":
      return { name: "autorenew",        bg: "#1D9BF020", color: "#1D9BF0" };
    default:
      return { name: "notifications",    bg: "#AF52DE20", color: "#AF52DE" };
  }
}

// Extrait le statut depuis le body pour les notifications de type status_change
function extractStatusKey(type: string, body: string): string | null {
  if (type !== "status_change") return null;
  const lower = body.toLowerCase();
  if (lower.includes("en cours"))  return "in_progress";
  if (lower.includes("résolu"))    return "resolved";
  if (lower.includes("déclaré"))   return "reported";
  return null;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(c: AppColors, bottomInset: number) {
  return StyleSheet.create({
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.background,
    },
    container: {
      flexGrow: 1,
      backgroundColor: c.background,
      paddingHorizontal: 20,
      paddingTop: 48,
      paddingBottom: getTabBarScrollPadding(bottomInset),
    },

    // ── Header ──
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 24,
    },
    title: { fontSize: 28, fontWeight: "800", color: c.text },
    unreadBadge: {
      backgroundColor: c.primary,
      borderRadius: 12,
      paddingHorizontal: 9,
      paddingVertical: 3,
      marginLeft: 8,
    },
    unreadBadgeText: { fontSize: 12, fontWeight: "700", color: "#fff" },
    readAllBtn: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: c.primary + "18",
    },
    readAllText: { fontSize: 13, fontWeight: "600", color: c.primary },

    // ── Items ──
    list: {
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: c.secondary,
    },
    item: {
      flexDirection: "row",
      alignItems: "stretch",
      overflow: "hidden",
    },
    itemUnread: { backgroundColor: c.primary + "08" },
    itemDivider: { borderBottomWidth: 1, borderBottomColor: c.secondary },
    stripe: { width: 4 },
    inner: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 14,
      gap: 12,
    },
    itemContent: { flex: 1, minWidth: 0 },
    itemTitle: { fontSize: 14, fontWeight: "700", color: c.text, marginBottom: 2 },
    itemTitleRead: { fontWeight: "500", opacity: 0.55 },
    itemBody: { fontSize: 12, color: c.text, opacity: 0.65, marginBottom: 3, lineHeight: 17 },
    itemTime: { fontSize: 11, fontWeight: "500", color: c.primary, opacity: 0.7 },
    itemTimeRead: { color: c.text, opacity: 0.3 },
    right: { alignItems: "flex-end", gap: 6 },
    statusBadge: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4 },
    statusBadgeText: { fontSize: 11, fontWeight: "700" },
    chevron: { fontSize: 18, color: c.text, opacity: 0.2, lineHeight: 20 },

    // ── Empty ──
    emptyWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 80,
      gap: 12,
    },
    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyTitle: { fontSize: 16, fontWeight: "700", color: c.text, opacity: 0.5 },
    emptySub: { fontSize: 13, color: c.text, opacity: 0.3, textAlign: "center" },

    errorText: { color: "#e53e3e", fontSize: 14, textAlign: "center" },
  });
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const { isAuthenticated, loading } = useAuth();
  const { colors } = useAppColors();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, bottomInset), [colors, bottomInset]);
  const { refreshCount } = useNotificationContext();

  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [fetching, setFetching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace("/login");
  }, [loading, isAuthenticated]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setFetching(true);
    setError(null);
    try {
      const token = await getValidToken();
      if (!token) return;
      const res = await getNotifications(token, { page_size: 50 });
      setItems(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : STRINGS.api.genericError);
    } finally {
      setFetching(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated) void load();
  }, [loading, isAuthenticated, load]);

  const handleRefresh = () => { setRefreshing(true); void load(true); };

  const handleTap = async (item: NotificationResponse) => {
    if (!item.is_read) {
      setItems(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
      try {
        const token = await getValidToken();
        if (!token) return;
        await markAsRead(token, item.id);
        refreshCount();
      } catch {
        setItems(prev => prev.map(n => n.id === item.id ? { ...n, is_read: false } : n));
      }
    }
    if (item.incident_id) {
      router.push(`/(tabs)/explore?selectId=${item.incident_id}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (markingAll || items.every(n => n.is_read)) return;
    setMarkingAll(true);
    const prev = items;
    setItems(p => p.map(n => ({ ...n, is_read: true })));
    try {
      const token = await getValidToken();
      if (!token) throw new Error();
      await markAllAsRead(token);
      refreshCount();
    } catch {
      setItems(prev);
    } finally {
      setMarkingAll(false);
    }
  };

  if (loading || fetching) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const unreadCount = items.filter(n => !n.is_read).length;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
      }
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.readAllBtn}
            onPress={handleMarkAllAsRead}
            disabled={markingAll}
            activeOpacity={0.7}
          >
            {markingAll
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Text style={styles.readAllText}>Tout lire</Text>
            }
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* ── Empty state ── */}
      {!error && items.length === 0 && (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <MaterialIcons name="notifications-none" size={32} color={colors.text + "40"} />
          </View>
          <Text style={styles.emptyTitle}>Aucune notification</Text>
          <Text style={styles.emptySub}>Vous serez notifié des mises à jour{"\n"}de vos signalements ici.</Text>
        </View>
      )}

      {/* ── Liste ── */}
      {items.length > 0 && (
        <View style={styles.list}>
          {items.map((item, index) => {
            const icon = getIconConfig(item.type); // couleur de la stripe gauche
            const isLast = index === items.length - 1;
            const statusKey = extractStatusKey(item.type, item.body ?? "");
            const statusColor = statusKey ? STATUS_COLOR[statusKey] : null;
            const statusLabel = statusKey ? STATUS_LABEL[statusKey] : null;
            const stripeColor = item.is_read ? icon.color + "40" : icon.color;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.item,
                  !item.is_read && styles.itemUnread,
                  !isLast && styles.itemDivider,
                ]}
                onPress={() => void handleTap(item)}
                activeOpacity={0.75}
              >
                <View style={[styles.stripe, { backgroundColor: stripeColor }]} />
                <View style={styles.inner}>
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemTitle, item.is_read && styles.itemTitleRead]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.body ? (
                      <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
                    ) : null}
                    <Text style={[styles.itemTime, item.is_read && styles.itemTimeRead]}>
                      {timeAgo(item.created_at)}
                    </Text>
                  </View>
                  <View style={styles.right}>
                    {statusColor && statusLabel && (
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
                        <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
                      </View>
                    )}
                    {item.incident_id && <Text style={styles.chevron}>›</Text>}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
