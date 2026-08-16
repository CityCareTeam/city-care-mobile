import MaterialIcons from "@expo/vector-icons/MaterialIcons"; // empty state icon
import { makeRowStyles, NotificationRow } from "@/components/notifications/NotificationRow";
import { useNotificationContext } from "@/context/NotificationContext";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { mixHex } from "@/utils/color";
import { dayBucket, type DayBucket } from "@/utils/format-date";
import { getTabBarScrollPadding } from "@/utils/layout";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { POLL_INTERVAL_MS } from "@/constants/config";
import { STRINGS } from "@/constants/strings";
import { deleteAllNotifications, deleteNotification, getNotifications, markAllAsRead, markAsRead } from "@/services/notifications";
import { getValidToken } from "@/storage/tokens";
import type { NotificationResponse } from "@/types/notifications";
import { useAppRefreshControl } from "@/components/ui/AppRefreshControl";
import { useStrings } from "@/hooks/use-strings";
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
    //
    // Bande teintée, sans ombre ni bordure, largement arrondie et débordant
    // dans les marges : rien de tout cela n'appartient à une ligne. La teinte
    // est calculée et non superposée — un fond translucide laisse voir les
    // ombres à travers sur Android, on en a déjà fait les frais.
    headerCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 18,
      paddingHorizontal: 18,
      marginHorizontal: -4,
      borderRadius: 26,
      backgroundColor: mixHex(c.background, c.primary, 0.16),
      marginBottom: 20,
    },
    // Bulle pleine et large, icône claire : les lignes font l'inverse — bulle
    // pâle de quarante-deux points, icône colorée.
    headerIcon: {
      width: 54,
      height: 54,
      borderRadius: 27,
      alignItems: "center",
      justifyContent: "center",
    },
    headerText: { flex: 1, gap: 2 },
    // Vingt-huit points là où le titre d'une ligne en fait quatorze. C'est cet
    // écart, plus que la couleur, qui dit « titre de page ».
    title: { fontSize: 28, fontWeight: "800", color: c.text, letterSpacing: -0.5 },
    summary: { fontSize: 13, color: c.text, opacity: 0.55 },
    actions: { flexDirection: "row", alignItems: "center", gap: 8 },
    // Sur fond blanc : posés sur la bande teintée, ils s'en détachent au lieu
    // de s'y fondre.
    readAllBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: c.white,
      alignItems: "center", justifyContent: "center",
    },
    clearBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: c.white,
      alignItems: "center", justifyContent: "center",
    },
    groupLabel: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: c.text,
      opacity: 0.4,
      marginTop: 8,
      marginBottom: 8,
      marginLeft: 4,
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
  const t = useStrings();

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
    Alert.alert(t.notifications.clearTitle, t.notifications.clearMessage, [
      { text: t.alert.cancel, style: "cancel" },
      {
        text: t.notifications.delete,
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

  // Une liste de cinquante lignes sans repère se lit mal : on ne sait pas où
  // s'arrête ce qui vient d'arriver. Seule la première ligne d'un jour porte son
  // titre — la liste reste une liste, elle gagne juste des paliers.
  const grouped = useMemo(() => {
    let previous: DayBucket | null = null;
    return items.map((item) => {
      const bucket = dayBucket(item.created_at);
      const label = bucket === previous ? null : t.notifications[bucket];
      previous = bucket;
      return { item, label };
    });
  }, [items, t]);

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
      data={grouped}
      keyExtractor={(entry) => entry.item.id}
      contentContainerStyle={styles.container}
      // La liste ne monte que les lignes visibles. Avec cinquante notifications
      // portant chacune un détecteur de gestes, tout monter d'un coup coûtait
      // cher pour rien.
      renderItem={({ item: entry }) => (
        <>
          {entry.label && <Text style={styles.groupLabel}>{entry.label}</Text>}
          <NotificationRow
            item={entry.item}
            styles={rowStyles}
            onPress={handleTap}
            onDelete={handleDeleteOne}
          />
        </>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshControl={refreshControl}
      ListHeaderComponent={
        <>
          {/* La bande teintée est revenue — c'était le bon style ; ce qui
              clochait, c'est qu'elle avait aussi l'*anatomie* d'une ligne :
              bulle, titre, sous-titre, actions à droite, aux mêmes tailles.

              Ce qui la sort de la liste tient en trois écarts : un titre de
              vingt-huit points quand une ligne en fait quatorze, une bulle
              nettement plus grande, et une bande plus large que les cartes
              qu'elle surplombe. On garde le style, on casse la confusion. */}
          <View style={styles.headerCard}>
            <View style={[styles.headerIcon, { backgroundColor: colors.primary }]}>
              <MaterialIcons
                name={unreadCount > 0 ? "notifications-active" : "notifications-none"}
                size={26}
                color="#fff"
              />
            </View>

            <View style={styles.headerText}>
              <Text style={styles.title}>{t.notifications.title}</Text>
              <Text style={styles.summary}>
                {items.length === 0
                  ? t.notifications.empty
                  : unreadCount > 0
                    ? t.notifications.unreadSummary(unreadCount)
                    : t.notifications.allRead}
              </Text>
            </View>

            {items.length > 0 && (
              <View style={styles.actions}>
                {unreadCount > 0 && (
                  <TouchableOpacity
                    style={styles.readAllBtn}
                    onPress={handleMarkAllAsRead}
                    disabled={markingAll}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={t.notifications.readAll}
                  >
                    {markingAll
                      ? <ActivityIndicator size="small" color={colors.primary} />
                      : <MaterialIcons name="done-all" size={19} color={colors.primary} />
                    }
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={handleClearAll}
                  disabled={clearingAll}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={t.notifications.clearAllA11y}
                >
                  {clearingAll
                    ? <ActivityIndicator size="small" color="#e53e3e" />
                    : <MaterialIcons name="delete-outline" size={19} color="#e53e3e" />
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
            <Text style={styles.emptyTitle}>{t.notifications.empty}</Text>
            <Text style={styles.emptySub}>
              Vous serez notifié des mises à jour{"\n"}de vos signalements ici.
            </Text>
          </View>
        )
      }
    />
  );

}
