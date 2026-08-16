import MaterialIcons from "@expo/vector-icons/MaterialIcons"; // empty state icon
import { makeRowStyles, NotificationRow } from "@/components/notifications/NotificationRow";
import { useNotificationContext } from "@/context/NotificationContext";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { getTabBarScrollPadding } from "@/utils/layout";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { POLL_INTERVAL_MS } from "@/constants/config";
import { STRINGS } from "@/constants/strings";
import { deleteAllNotifications, deleteNotification, getNotifications, markAllAsRead, markAsRead } from "@/services/notifications";
import { getValidToken } from "@/storage/tokens";
import type { NotificationResponse } from "@/types/notifications";
import { useAppRefreshControl } from "@/components/ui/AppRefreshControl";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";

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
      paddingHorizontal: 16,
      paddingTop: 48,
      paddingBottom: getTabBarScrollPadding(bottomInset),
    },

    // ── Header ──
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
      paddingHorizontal: 4,
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
    clearBtn: {
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: "#e53e3e18",
      alignItems: "center", justifyContent: "center",
    },

    separator: { height: 8 },

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

  });
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const { isAuthenticated, loading } = useAuth();
  const { colors } = useAppColors();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, bottomInset), [colors, bottomInset]);
  const rowStyles = useMemo(() => makeRowStyles(colors), [colors]);
  const { refreshCount } = useNotificationContext();

  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [fetching, setFetching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

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

  // Le badge de l'onglet se rafraîchit toutes les 30 s, mais la liste ne le
  // faisait qu'au montage : on arrivait sur un badge « 3 » et une liste
  // inchangée. Elle suit désormais la même cadence, se remet à jour au retour
  // sur l'onglet, et resserre le rythme tant qu'un chargement échoue.
  useAutoRefresh(load, {
    interval: POLL_INTERVAL_MS.notifications,
    failed: error !== null,
    enabled: !loading && isAuthenticated,
  });

  const handleRefresh = () => { setRefreshing(true); void load(true); };

  // Mémoïsés pour que le `memo` des lignes serve à quelque chose : recréés à
  // chaque rendu, ils feraient re-rendre les cinquante lignes à chaque sondage.
  const handleTap = useCallback(async (item: NotificationResponse) => {
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
      const tab = item.type === "new_message" ? "&tab=chat" : "";
      router.push(`/(tabs)/explore?selectId=${item.incident_id}${tab}`);
    }
  }, [refreshCount]);

  const handleClearAll = () => {
    if (clearingAll || items.length === 0) return;
    Alert.alert("Vider les notifications", "Supprimer toutes vos notifications ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          setClearingAll(true);
          const prev = items;
          setItems([]);
          try {
            const token = await getValidToken();
            if (!token) throw new Error();
            await deleteAllNotifications(token);
            refreshCount();
          } catch {
            setItems(prev);
          } finally {
            setClearingAll(false);
          }
        },
      },
    ]);
  };

  const handleDeleteOne = useCallback(async (id: string) => {
    setItems(prev => prev.filter(n => n.id !== id));
    try {
      const token = await getValidToken();
      if (!token) throw new Error();
      await deleteNotification(token, id);
      refreshCount();
    } catch {
      // rollback silencieux — on recharge
      void load(true);
    }
  }, [load, refreshCount]);

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

  // Avant le retour anticipé qui suit : c'est un crochet.
  const refreshControl = useAppRefreshControl({
    refreshing,
    onRefresh: handleRefresh,
    offset: 24,
  });

  // Voile plein seulement quand il n'y a encore rien à montrer. Il remplaçait
  // l'écran entier — en-tête compris — à chaque retour sur l'onglet.
  if (loading || (fetching && items.length === 0)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const unreadCount = items.filter(n => !n.is_read).length;

  return (
    <FlatList
      data={items}
      keyExtractor={(n) => n.id}
      contentContainerStyle={styles.container}
      // La liste ne monte que les lignes visibles. Avec cinquante notifications
      // portant chacune un détecteur de gestes, tout monter d'un coup coûtait
      // cher pour rien.
      renderItem={({ item }) => (
        <NotificationRow
          item={item}
          styles={rowStyles}
          onPress={handleTap}
          onDelete={handleDeleteOne}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshControl={refreshControl}
      ListHeaderComponent={
        <>
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.title}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            {items.length > 0 && (
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
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
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={handleClearAll}
                  disabled={clearingAll}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Vider toutes les notifications"
                >
                  {clearingAll
                    ? <ActivityIndicator size="small" color="#e53e3e" />
                    : <MaterialIcons name="delete-outline" size={18} color="#e53e3e" />
                  }
                </TouchableOpacity>
              </View>
            )}
          </View>

          {error && <ErrorNotice detail={error} onRetry={() => void load()} />}
        </>
      }
      ListEmptyComponent={
        error ? null : (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="notifications-none" size={32} color={colors.text + "40"} />
            </View>
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptySub}>
              Vous serez notifié des mises à jour{"\n"}de vos signalements ici.
            </Text>
          </View>
        )
      }
    />
  );

}
