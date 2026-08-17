import { ModalShell } from "@/components/ui/ModalShell";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/ToastMessage";
import { useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import {
  ADMIN_PAGE_SIZE,
  ADMIN_ROLES,
  getAdminUsers,
  ROLE_LABEL_KEY,
  setUserEnabled,
  setUserRole,
  type AdminRole,
  type AdminUser,
} from "@/services/admin";
import { getValidToken } from "@/storage/tokens";
import { timeAgo } from "@/utils/format-date";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "@/components/ui/AppText";

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
 * L'ordre d'affichage : le personnel d'abord, les comptes coupés en dernier.
 *
 * Une liste de comptes se parcourt pour deux raisons — vérifier qui a des droits,
 * et retrouver quelqu'un. Le tri alphabétique ne sert ni l'un ni l'autre : les
 * trois agents d'une ville se perdent au milieu de deux cents citoyens. Les
 * désactivés ferment la marche parce qu'ils ne participent plus.
 */
const ROLE_WEIGHT: Record<AdminRole, number> = { admin: 0, agent: 1, citizen: 2 };

type Filter = AdminRole | "all";

/**
 * Gestion des comptes — rôles et accès.
 *
 * Vit dans le menu latéral et non dans la barre du bas : celle-ci porte ce qu'on
 * fait tous les jours, et nommer un agent n'arrive pas tous les jours.
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
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  /**
   * La carte dépliée — une seule à la fois.
   *
   * En accordéon plutôt qu'ouvertes indépendamment : la liste reste courte, et on
   * voit sans hésiter sur quel compte on est en train d'agir. Ouvrir un compte
   * referme donc le précédent.
   */
  const [openId, setOpenId] = useState<string | null>(null);

  /**
   * Charge une page.
   *
   * `first === 0` remplace la liste — c'est une nouvelle recherche ; au-delà on
   * ajoute à la suite. `hasMore` se déduit de la taille reçue : une page pleine
   * laisse supposer une suivante, une page courte prouve qu'il n'y en a pas.
   * Keycloak ne renvoyant aucun total, c'est le seul signal disponible.
   */
  const load = useCallback(async (query: string, first = 0) => {
    if (first === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const token = await getValidToken();
      if (!token) throw new Error("no token");
      const page = await getAdminUsers(token, query, first);
      setUsers((current) => (first === 0 ? page : [...current, ...page]));
      setHasMore(page.length === ADMIN_PAGE_SIZE);
      setFailed(false);
    } catch {
      // Un échec en cours de déroulé ne jette pas ce qui est déjà affiché : on
      // rend seulement le bouton, pour réessayer.
      if (first === 0) setFailed(true);
      setHasMore(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
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

  /** Les effectifs par rôle, sur ce que le serveur vient de renvoyer. */
  const counts = useMemo(() => {
    const acc: Record<Filter, number> = { all: users.length, citizen: 0, agent: 0, admin: 0 };
    for (const user of users) acc[user.role ?? "citizen"] += 1;
    return acc;
  }, [users]);

  const shown = useMemo(() => {
    const kept = filter === "all" ? users : users.filter((u) => (u.role ?? "citizen") === filter);
    return [...kept].sort((a, b) => {
      // Coupé ou non d'abord : un compte inactif n'est plus une personne à qui
      // l'on confie quelque chose.
      if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
      const weight = ROLE_WEIGHT[a.role ?? "citizen"] - ROLE_WEIGHT[b.role ?? "citizen"];
      if (weight !== 0) return weight;
      return (a.display_name || a.username).localeCompare(b.display_name || b.username);
    });
  }, [users, filter]);

  async function applyRole(user: AdminUser, role: AdminRole) {
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
   * Donner les pleins pouvoirs demande confirmation ; le reste non.
   *
   * Un administrateur peut tout faire, y compris rétrograder celui qui vient de
   * le nommer. Ce geste-là mérite la même friction que couper un accès — et
   * seulement celui-là : demander confirmation à chaque changement de rôle
   * apprendrait surtout à appuyer sur « oui » sans lire.
   */
  function changeRole(user: AdminUser, role: AdminRole) {
    if (role !== "admin") {
      void applyRole(user, role);
      return;
    }

    Alert.alert(t.admin.promoteTitle, t.admin.promoteMessage(user.display_name || user.username), [
      { text: t.alert.cancel, style: "cancel" },
      { text: t.admin.promoteConfirm, onPress: () => void applyRole(user, role) },
    ]);
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

    Alert.alert(t.admin.disableTitle, t.admin.disableMessage(user.display_name || user.username), [
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

      {/* Filtrer par rôle répond à la question qu'on se pose vraiment en ouvrant
          cette page : qui a des droits ? Les effectifs sont sur les puces —
          « Agents 3 » se lit sans avoir à appuyer dessus.
          Le filtre porte sur ce qui est chargé, pas sur l'ensemble : Keycloak ne
          sait pas filtrer par rôle, et le dire vaut mieux que de laisser lire ces
          chiffres comme des totaux. */}
      {!failed && (
        <View style={styles.filters}>
          {(["all", ...ADMIN_ROLES] as Filter[]).map((option) => {
            const active = filter === option;
            const color = option === "all" ? colors.primary : ROLE_COLOR[option];
            return (
              <TouchableOpacity
                key={option}
                style={[styles.filter, active && { backgroundColor: color, borderColor: color }]}
                onPress={() => setFilter(option)}
                activeOpacity={0.8}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[styles.filterLabel, active ? styles.filterLabelActive : { color }]}
                  numberOfLines={1}
                >
                  {option === "all" ? t.home.allFilter : t.roles[ROLE_LABEL_KEY[option]]}
                </Text>
                <Text style={[styles.filterCount, active ? styles.filterLabelActive : { color }]}>
                  {counts[option]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Dit une fois que ces chiffres décrivent les comptes chargés, tant qu'il
          en reste à charger. Se taire les ferait lire comme des totaux — et
          « Agents 2 » sur une ville qui en a douze est pire qu'aucun chiffre. */}
      {!loading && !failed && hasMore && <Text style={styles.partialHint}>{t.admin.partialCounts}</Text>}

      {loading && (
        <View style={styles.skeletons}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.card}>
              <View style={[styles.stripe, { backgroundColor: colors.chipBorder }]} />
              <View style={styles.body}>
                <View style={styles.identityRow}>
                  <Skeleton style={styles.skeletonAvatar} />
                  <View style={styles.identity}>
                    <Skeleton style={styles.skeletonName} />
                    <Skeleton style={styles.skeletonEmail} />
                  </View>
                </View>
              </View>
            </View>
          ))}
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

      {!loading && !failed && shown.length === 0 && (
        <View style={styles.center}>
          <MaterialIcons name="person-search" size={28} color={colors.text + "40"} />
          <Text style={styles.notice}>{t.admin.noUsers}</Text>
        </View>
      )}

      {!loading &&
        !failed &&
        shown.map((user) => {
          // Le serveur refuse déjà qu'on agisse sur soi ; ne pas l'offrir évite
          // de présenter un bouton qui ne peut que répondre non.
          const isSelf = keycloakUser?.sub === user.id;
          const busy = busyId === user.id;
          const role = user.role ?? "citizen";
          const accent = ROLE_COLOR[role];
          const open = openId === user.id;
          const name = user.display_name || user.username;

          return (
            <View key={user.id} style={[styles.card, open && styles.cardOpen]}>
              {/* Le liseré porte la couleur du rôle sur toute la hauteur : c'est
                  le même vocabulaire que les lignes de signalement, où la bande
                  dit le statut. On lit la composition de la liste en la
                  parcourant, sans lire un seul mot. */}
              <View style={[styles.stripe, { backgroundColor: user.enabled ? accent : colors.statusRed }]} />

              <View style={styles.body}>
                {/* Toute l'en-tête est la zone d'ouverture : viser un chevron de
                    vingt points au pouce, sur une liste qu'on déroule, rate une
                    fois sur trois. */}
                <TouchableOpacity
                  style={styles.identityRow}
                  onPress={() => setOpenId(open ? null : user.id)}
                  activeOpacity={0.6}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  accessibilityLabel={name}
                >
                  <View style={[styles.avatar, { backgroundColor: accent + "1F" }]}>
                    <Text style={[styles.avatarText, { color: accent }]}>
                      {(name || "?").charAt(0).toUpperCase()}
                    </Text>
                    {!user.enabled && (
                      <View style={styles.avatarCut}>
                        <MaterialIcons name="block" size={11} color="#fff" />
                      </View>
                    )}
                  </View>

                  <View style={styles.identity}>
                    <View style={styles.nameRow}>
                      <Text
                        style={[styles.name, !user.enabled && styles.nameCut]}
                        numberOfLines={1}
                      >
                        {name}
                      </Text>
                      {isSelf && <Text style={styles.selfTag}>{t.admin.you}</Text>}
                    </View>
                    <View style={styles.metaRow}>
                      {/* Le rôle en toutes lettres, à côté de l'adresse : au repos
                          la carte se lit, elle ne se manipule pas. */}
                      <View style={[styles.roleTag, { backgroundColor: accent + "1A" }]}>
                        <MaterialIcons name={ROLE_ICON[role]} size={10} color={accent} />
                        <Text style={[styles.roleTagText, { color: accent }]} numberOfLines={1}>
                          {t.roles[ROLE_LABEL_KEY[role]]}
                        </Text>
                      </View>
                      <Text style={styles.email} numberOfLines={1}>
                        {user.email ?? user.username}
                      </Text>
                    </View>

                    {/* La dernière venue, en clair. Un compte jamais utilisé le
                        dit — inventer une date serait pire que n'en donner
                        aucune. */}
                    <Text style={styles.lastSeen} numberOfLines={1}>
                      {user.last_seen_at
                        ? t.admin.lastSeen(timeAgo(user.last_seen_at, t).toLowerCase())
                        : t.admin.neverSeen}
                    </Text>
                  </View>

                  {busy ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <MaterialIcons
                      name={open ? "expand-less" : "expand-more"}
                      size={22}
                      color={colors.text + "59"}
                    />
                  )}
                </TouchableOpacity>

                {/* Les commandes ne se déploient qu'à la demande, et sur une
                    carte à la fois. Trois segments et un bouton rouge sur chacune
                    des quarante lignes faisaient un mur : on ouvre cette page pour
                    lire dix fois et modifier une. */}
                {open && !busy && (
                  <View style={styles.actions}>
                    <Text style={styles.actionsLabel}>{t.admin.roleLabel}</Text>
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
                            onPress={() => changeRole(user, option)}
                            disabled={active || isSelf}
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

                    {isSelf ? (
                      // Dire pourquoi les boutons sont éteints vaut mieux que de
                      // les éteindre sans un mot : on cherche sinon ce qui ne va
                      // pas.
                      <Text style={styles.selfHint}>{t.admin.selfHint}</Text>
                    ) : (
                      <TouchableOpacity
                        style={[styles.access, user.enabled ? styles.accessCut : styles.accessGive]}
                        onPress={() => toggleEnabled(user)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                      >
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
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })}

      {/* Une page pleine laisse supposer une suivante : Keycloak ne renvoie aucun
          total, et l'absence de bouton est la seule façon honnête de dire qu'on
          est au bout. */}
      {!loading && !failed && hasMore && (
        <TouchableOpacity
          style={styles.more}
          onPress={() => void load(search, users.length)}
          disabled={loadingMore}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          {loadingMore ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.moreLabel}>{t.home.loadMore}</Text>
          )}
        </TouchableOpacity>
      )}
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
      marginBottom: 10,
      paddingHorizontal: 13,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: c.chipBg,
      borderWidth: 1,
      borderColor: c.chipBorder,
    },
    searchInput: { flex: 1, fontSize: 14, color: c.text, padding: 0 },

    filters: { flexDirection: "row", gap: 5, marginBottom: 14 },
    filter: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: 7,
      paddingHorizontal: 3,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: c.chipBorder,
      backgroundColor: c.chipBg,
    },
    filterLabel: { flexShrink: 1, fontSize: 11, fontWeight: "700" },
    filterCount: { fontSize: 11, fontWeight: "800", opacity: 0.75 },
    filterLabelActive: { color: "#fff", opacity: 1 },
    partialHint: {
      fontSize: 10.5,
      color: c.text,
      opacity: 0.45,
      marginTop: -8,
      marginBottom: 12,
      lineHeight: 15,
    },
    more: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.chipBorder,
      backgroundColor: c.chipBg,
      minHeight: 44,
    },
    moreLabel: { fontSize: 13, fontWeight: "700", color: c.primary },

    skeletons: { gap: 10 },
    skeletonAvatar: { width: 38, height: 38, borderRadius: 13 },
    skeletonName: { width: "55%", height: 13, borderRadius: 5 },
    skeletonEmail: { width: "75%", height: 10, borderRadius: 5, marginTop: 6 },

    card: {
      flexDirection: "row",
      alignItems: "stretch",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.chipBorder,
      backgroundColor: c.white,
      marginBottom: 10,
      overflow: "hidden",
    },
    // Dépliée, la carte se détache de ses voisines : on sait sur quoi on agit.
    cardOpen: { borderColor: c.primary + "59" },
    stripe: { width: 4 },
    body: { flex: 1, padding: 12, gap: 12, minWidth: 0 },

    identityRow: { flexDirection: "row", alignItems: "center", gap: 11 },
    avatar: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
    avatarText: { fontSize: 16, fontWeight: "800" },
    // Le pictogramme mord sur le coin de la pastille : l'état du compte tient
    // ainsi dans le même espace que son initiale.
    avatarCut: {
      position: "absolute",
      right: -4,
      bottom: -4,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: c.statusRed,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: c.white,
    },
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
    // Barré quand le compte est coupé : l'état se lit sur le nom lui-même, pas
    // seulement sur une pastille à côté.
    nameCut: { textDecorationLine: "line-through", opacity: 0.55 },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 6, minWidth: 0 },
    email: { flexShrink: 1, fontSize: 11.5, color: c.text, opacity: 0.5 },
    lastSeen: { fontSize: 10.5, color: c.text, opacity: 0.38 },
    roleTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 7,
      flexShrink: 0,
    },
    roleTagText: { fontSize: 10, fontWeight: "800" },

    // Séparées de l'identité par un filet : ce qui se lit d'un côté, ce qui
    // s'actionne de l'autre.
    actions: {
      gap: 8,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: c.chipBorder,
    },
    actionsLabel: {
      fontSize: 9.5,
      fontWeight: "800",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: c.text,
      opacity: 0.4,
    },

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
    selfHint: { fontSize: 11.5, color: c.text, opacity: 0.45, textAlign: "center", lineHeight: 16 },

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
