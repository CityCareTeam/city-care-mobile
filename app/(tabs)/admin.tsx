import { useAppRefreshControl } from "@/components/ui/AppRefreshControl";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { Toast } from "@/components/ui/ToastMessage";
import { useAuth } from "@/context/AuthContext";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import {
  ADMIN_ROLES,
  getAdminUsers,
  setUserEnabled,
  setUserRole,
  type AdminRole,
  type AdminUser,
} from "@/services/admin";
import { getValidToken } from "@/storage/tokens";
import { getTabBarScrollPadding } from "@/utils/layout";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ROLE_COLOR: Record<AdminRole, string> = {
  Citizen: "#78909C",
  Agent: "#1D9BF0",
  Admin: "#AF52DE",
};

/**
 * Gestion des comptes — rôles et accès.
 *
 * Réservée aux administrateurs, et gardée ici en plus de l'être côté serveur :
 * l'onglet n'apparaît pas dans la barre pour les autres, mais un lien profond
 * atteint l'écran quand même. Une porte qu'on ne voit pas reste une porte.
 *
 * Deux gestes, et deux seulement. Changer le rôle, qui décide de ce qu'une
 * personne peut faire. Désactiver le compte, qui l'empêche de se connecter sans
 * rien effacer de ce qu'elle a écrit — supprimer emporterait des signalements
 * qui appartiennent à la ville autant qu'à elle, et ne se rattrape pas.
 */
export default function AdminScreen() {
  const { colors } = useAppColors();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, bottomInset), [colors, bottomInset]);
  const t = useStrings();
  const { isAdmin, loading: authLoading, keycloakUser } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace("/(tabs)");
  }, [authLoading, isAdmin]);

  const load = useCallback(
    async (query: string, silent = false) => {
      if (!silent) setLoading(true);
      try {
        const token = await getValidToken();
        if (!token) throw new Error("no token");
        setUsers(await getAdminUsers(token, query));
        setFailed(false);
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isAdmin) return;
    // La recherche part au serveur — c'est Keycloak qui détient les comptes, pas
    // nous — donc on attend que la frappe se calme plutôt que d'interroger à
    // chaque lettre.
    const timer = setTimeout(() => void load(search), search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [search, load, isAdmin]);

  const [refreshing, setRefreshing] = useState(false);
  const control = useAppRefreshControl({
    refreshing,
    onRefresh: async () => {
      setRefreshing(true);
      await load(search, true);
      setRefreshing(false);
    },
  });

  async function changeRole(user: AdminUser, role: AdminRole) {
    setBusyId(user.id);
    try {
      const token = await getValidToken();
      if (!token) throw new Error("no token");
      await setUserRole(user.id, role, token);
      setUsers((current) => current.map((u) => (u.id === user.id ? { ...u, role } : u)));
      Toast.show({ type: "success", text1: t.admin.roleChanged });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: t.alert.errorTitle,
        text2: e instanceof Error ? e.message : t.api.unknownError,
      });
    } finally {
      setBusyId(null);
    }
  }

  /**
   * Désactiver demande confirmation, réactiver non.
   *
   * Ce n'est pas de la symétrie manquée : couper l'accès à quelqu'un se fait par
   * mégarde, le lui rendre jamais.
   */
  function toggleEnabled(user: AdminUser) {
    const next = !user.enabled;

    const apply = async () => {
      setBusyId(user.id);
      try {
        const token = await getValidToken();
        if (!token) throw new Error("no token");
        await setUserEnabled(user.id, next, token);
        setUsers((current) =>
          current.map((u) => (u.id === user.id ? { ...u, enabled: next } : u)),
        );
        Toast.show({ type: "success", text1: next ? t.admin.enabled : t.admin.disabled });
      } catch (e) {
        Toast.show({
          type: "error",
          text1: t.alert.errorTitle,
          text2: e instanceof Error ? e.message : t.api.unknownError,
        });
      } finally {
        setBusyId(null);
      }
    };

    if (next) {
      void apply();
      return;
    }

    Alert.alert(t.admin.disableTitle, t.admin.disableMessage(user.display_name), [
      { text: t.alert.cancel, style: "cancel" },
      { text: t.admin.disable, style: "destructive", onPress: () => void apply() },
    ]);
  }

  if (authLoading || !isAdmin) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.admin.title}</Text>
        <Text style={styles.subtitle}>{t.admin.subtitle}</Text>
      </View>

      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={18} color={colors.text} style={{ opacity: 0.4 }} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={t.admin.searchPlaceholder}
          placeholderTextColor={colors.text + "66"}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch("")}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t.home.searchClear}
          >
            <MaterialIcons name="close" size={17} color={colors.text} style={{ opacity: 0.4 }} />
          </TouchableOpacity>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : failed ? (
        <ErrorNotice detail={t.admin.loadFailed} onRetry={() => void load(search)} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(user) => user.id}
          refreshControl={control}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t.admin.noUsers}</Text>}
          renderItem={({ item: user }) => {
            // Le serveur refuse déjà qu'on agisse sur soi ; ne pas l'offrir évite
            // de présenter un bouton qui ne peut que répondre non.
            const isSelf = keycloakUser?.sub === user.id;
            const busy = busyId === user.id;

            return (
              <View style={[styles.card, !user.enabled && styles.cardDisabled]}>
                <View style={styles.cardHeader}>
                  <View style={styles.identity}>
                    <Text style={styles.name} numberOfLines={1}>
                      {user.display_name}
                      {isSelf ? ` · ${t.admin.you}` : ""}
                    </Text>
                    <Text style={styles.email} numberOfLines={1}>
                      {user.email ?? user.username}
                    </Text>
                  </View>
                  {!user.enabled && (
                    <View style={styles.disabledBadge}>
                      <Text style={styles.disabledBadgeText}>{t.admin.disabledTag}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.roles}>
                  {ADMIN_ROLES.map((role) => {
                    const active = user.role === role;
                    return (
                      <TouchableOpacity
                        key={role}
                        style={[
                          styles.role,
                          active && { backgroundColor: ROLE_COLOR[role], borderColor: ROLE_COLOR[role] },
                        ]}
                        onPress={() => void changeRole(user, role)}
                        disabled={active || isSelf || busy}
                        activeOpacity={0.8}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active, disabled: isSelf }}
                      >
                        <Text
                          style={[
                            styles.roleLabel,
                            active && styles.roleLabelActive,
                            isSelf && !active && { opacity: 0.3 },
                          ]}
                        >
                          {t.roles[role]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {!isSelf && (
                  <TouchableOpacity
                    style={[styles.access, user.enabled ? styles.accessCut : styles.accessGive]}
                    onPress={() => toggleEnabled(user)}
                    disabled={busy}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <>
                        <MaterialIcons
                          name={user.enabled ? "block" : "lock-open"}
                          size={15}
                          color={user.enabled ? colors.statusRed : colors.primary}
                        />
                        <Text
                          style={[
                            styles.accessLabel,
                            { color: user.enabled ? colors.statusRed : colors.primary },
                          ]}
                        >
                          {user.enabled ? t.admin.disable : t.admin.enable}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

function makeStyles(c: AppColors, bottomInset: number) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.background },
    header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
    title: { fontSize: 26, fontWeight: "800", color: c.text },
    subtitle: { fontSize: 13, color: c.text, opacity: 0.5, marginTop: 4 },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      marginHorizontal: 20,
      marginBottom: 12,
      paddingHorizontal: 13,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: c.white,
      borderWidth: 1,
      borderColor: c.chipBorder,
    },
    searchInput: { flex: 1, fontSize: 14, color: c.text, padding: 0 },
    list: { paddingHorizontal: 20, paddingBottom: getTabBarScrollPadding(bottomInset), gap: 10 },
    empty: { fontSize: 13, color: c.text, opacity: 0.45, textAlign: "center", paddingVertical: 30 },

    card: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.chipBorder,
      backgroundColor: c.white,
      padding: 14,
      gap: 11,
    },
    // Un compte coupé se lit d'un coup d'œil dans une liste qu'on parcourt.
    cardDisabled: { opacity: 0.6, borderColor: c.statusRed + "55" },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
    identity: { flex: 1, gap: 2 },
    name: { fontSize: 15, fontWeight: "700", color: c.text },
    email: { fontSize: 12, color: c.text, opacity: 0.5 },
    disabledBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 9,
      backgroundColor: c.statusRed,
    },
    disabledBadgeText: { fontSize: 10, fontWeight: "800", color: "#fff" },

    roles: { flexDirection: "row", gap: 6 },
    role: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 8,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: c.chipBorder,
      backgroundColor: c.chipBg,
    },
    roleLabel: { fontSize: 12, fontWeight: "700", color: c.text, opacity: 0.6 },
    roleLabelActive: { color: "#fff", opacity: 1 },

    access: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      minHeight: 40,
    },
    accessCut: { borderColor: c.statusRed + "66", backgroundColor: c.statusRed + "12" },
    accessGive: { borderColor: c.primary + "66", backgroundColor: c.primary + "12" },
    accessLabel: { fontSize: 13, fontWeight: "700" },
  });
}
