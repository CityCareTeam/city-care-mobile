import { ModalShell } from "@/components/ui/ModalShell";
import { Toast } from "@/components/ui/ToastMessage";
import { useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import {
  ADMIN_ROLES,
  getAdminUsers,
  ROLE_LABEL_KEY,
  setUserEnabled,
  setUserRole,
  type AdminRole,
  type AdminUser,
} from "@/services/admin";
import { getValidToken } from "@/storage/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/** Une couleur par rôle, et la même que partout ailleurs dans l'application. */
const ROLE_COLOR: Record<AdminRole, string> = {
  citizen: "#78909C",
  agent: "#1D9BF0",
  admin: "#AF52DE",
};

const ROLE_ICON: Record<AdminRole, React.ComponentProps<typeof MaterialIcons>["name"]> = {
  citizen: "person",
  agent: "engineering",
  admin: "shield",
};

/**
 * Gestion des comptes — rôles et accès.
 *
 * Vit dans le menu latéral et non dans la barre du bas : celle-ci porte ce qu'on
 * fait tous les jours, et nommer un agent n'arrive pas tous les jours. Un
 * sixième onglet aurait rétréci les cinq autres pour une page qu'on ouvre une
 * fois par mois.
 *
 * Deux gestes, et deux seulement. Changer le rôle, qui décide de ce qu'une
 * personne peut faire. Désactiver le compte, qui l'empêche de se connecter sans
 * rien effacer de ce qu'elle a écrit — supprimer emporterait des signalements
 * qui appartiennent à la ville autant qu'à elle, et ne se rattrape pas.
 */
export function AccountsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useAppColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useStrings();
  const { keycloakUser } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (query: string) => {
    setLoading(true);
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
  }, []);

  useEffect(() => {
    if (!visible) return;
    // La recherche part au serveur — c'est Keycloak qui détient les comptes, pas
    // nous — donc on attend que la frappe se calme plutôt que d'interroger à
    // chaque lettre.
    const timer = setTimeout(() => void load(search), search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [visible, search, load]);

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
        setUsers((current) => current.map((u) => (u.id === user.id ? { ...u, enabled: next } : u)));
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

  return (
    <ModalShell visible={visible} title={t.admin.title} onClose={onClose}>
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

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {!loading && failed && (
        <View style={styles.center}>
          <MaterialIcons name="cloud-off" size={28} color={colors.text + "40"} />
          <Text style={styles.notice}>{t.admin.loadFailed}</Text>
          <TouchableOpacity onPress={() => void load(search)} style={styles.retry} accessibilityRole="button">
            <Text style={styles.retryLabel}>{t.mapNotice.retry}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !failed && users.length === 0 && (
        <View style={styles.center}>
          <MaterialIcons name="person-search" size={28} color={colors.text + "40"} />
          <Text style={styles.notice}>{t.admin.noUsers}</Text>
        </View>
      )}

      {!loading &&
        !failed &&
        users.map((user) => {
          // Le serveur refuse déjà qu'on agisse sur soi ; ne pas l'offrir évite
          // de présenter un bouton qui ne peut que répondre non.
          const isSelf = keycloakUser?.sub === user.id;
          const busy = busyId === user.id;
          const role = user.role ?? "citizen";
          const accent = ROLE_COLOR[role];

          return (
            <View key={user.id} style={[styles.card, !user.enabled && styles.cardDisabled]}>
              <View style={styles.identityRow}>
                {/* L'initiale sur pastille colorée : le rôle se lit avant même le
                    nom quand on parcourt une liste de trente comptes. */}
                <View style={[styles.avatar, { backgroundColor: accent + "1F" }]}>
                  <Text style={[styles.avatarText, { color: accent }]}>
                    {(user.display_name || user.username || "?").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.identity}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {user.display_name || user.username}
                    </Text>
                    {isSelf && <Text style={styles.selfTag}>{t.admin.you}</Text>}
                  </View>
                  <Text style={styles.email} numberOfLines={1}>
                    {user.email ?? user.username}
                  </Text>
                </View>
                {!user.enabled && (
                  <View style={styles.disabledBadge}>
                    <MaterialIcons name="block" size={11} color="#fff" />
                    <Text style={styles.disabledBadgeText}>{t.admin.disabledTag}</Text>
                  </View>
                )}
              </View>

              <View style={styles.roles}>
                {ADMIN_ROLES.map((option) => {
                  const active = role === option;
                  const color = ROLE_COLOR[option];
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.role,
                        active && { backgroundColor: color, borderColor: color },
                        isSelf && !active && styles.roleLocked,
                      ]}
                      onPress={() => void changeRole(user, option)}
                      disabled={active || isSelf || busy}
                      activeOpacity={0.8}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active, disabled: isSelf }}
                      accessibilityLabel={t.roles[ROLE_LABEL_KEY[option]]}
                    >
                      <MaterialIcons
                        name={ROLE_ICON[option]}
                        size={13}
                        color={active ? "#fff" : color}
                        style={!active && { opacity: 0.75 }}
                      />
                      <Text
                        style={[styles.roleLabel, active ? styles.roleLabelActive : { color }]}
                        numberOfLines={1}
                      >
                        {t.roles[ROLE_LABEL_KEY[option]]}
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
        })}
    </ModalShell>
  );
}

function makeStyles(c: ReturnType<typeof useAppColors>["colors"]) {
  return StyleSheet.create({
    center: { alignItems: "center", gap: 12, paddingVertical: 30 },
    notice: { fontSize: 13, color: c.text, opacity: 0.6, textAlign: "center", lineHeight: 19 },
    retry: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 14, backgroundColor: c.primary },
    retryLabel: { fontSize: 13, fontWeight: "700", color: "#fff" },

    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      marginBottom: 14,
      paddingHorizontal: 13,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: c.chipBg,
      borderWidth: 1,
      borderColor: c.chipBorder,
    },
    searchInput: { flex: 1, fontSize: 14, color: c.text, padding: 0 },

    card: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.chipBorder,
      backgroundColor: c.white,
      padding: 13,
      marginBottom: 10,
      gap: 11,
    },
    // Un compte coupé se lit d'un coup d'œil dans une liste qu'on parcourt.
    cardDisabled: { borderColor: c.statusRed + "55", backgroundColor: c.statusRed + "08" },

    identityRow: { flexDirection: "row", alignItems: "center", gap: 11 },
    avatar: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
    avatarText: { fontSize: 16, fontWeight: "800" },
    identity: { flex: 1, gap: 2, minWidth: 0 },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    name: { flexShrink: 1, fontSize: 14.5, fontWeight: "700", color: c.text },
    selfTag: {
      fontSize: 10,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      color: c.primary,
    },
    email: { fontSize: 11.5, color: c.text, opacity: 0.5 },
    disabledBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 9,
      backgroundColor: c.statusRed,
    },
    disabledBadgeText: { fontSize: 10, fontWeight: "800", color: "#fff" },

    roles: { flexDirection: "row", gap: 6 },
    role: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: c.chipBorder,
      backgroundColor: c.chipBg,
    },
    // Sur sa propre ligne : visible, pour montrer le rôle qu'on a, mais éteint —
    // le serveur refuserait de toute façon qu'on se change soi-même.
    roleLocked: { opacity: 0.35 },
    roleLabel: { flexShrink: 1, fontSize: 11.5, fontWeight: "700" },
    roleLabelActive: { color: "#fff" },

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
