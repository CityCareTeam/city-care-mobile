import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { IncidentRow } from "@/components/incident-row";
import { Logo } from "@/components/ui/Logo";
import { STATUS_COLOR, STATUS_LABEL, TYPE_LABEL } from "@/constants/incidents";
import { ROLE_LABELS } from "@/constants/roles";
import { CityCareColors, CityCareColorsDark } from "@/constants/theme";
import { getTabBarScrollPadding } from "@/utils/layout";
import { GlassPillSelector, PillOption } from "@/components/ui/GlassPillSelector";
import { STRINGS } from "@/constants/strings";
import { useAuth } from "@/context/AuthContext";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { INCIDENTS_PAGE_SIZE } from "@/constants/config";
import { applyFilters, useIncidentFilters } from "@/hooks/use-incident-filters";
import { getIncidents } from "@/services/incidents";
import { getMyIncidents } from "@/services/users";
import { getValidToken } from "@/storage/tokens";
import type { IncidentResponse } from "@/types/incidents";
import type { MyIncidentItem } from "@/types/users";
import { EasterEggDog } from "@/components/easter-egg-dog";
import { useEasterEgg } from "@/hooks/use-easter-egg";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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

const STATUS_OPTIONS_4: PillOption<string | null>[] = [
  { label: "Tous",                    value: null },
  { label: STATUS_LABEL.reported,     value: "reported",    dotColor: STATUS_COLOR.reported },
  { label: STATUS_LABEL.in_progress,  value: "in_progress", dotColor: STATUS_COLOR.in_progress },
  { label: STATUS_LABEL.resolved,     value: "resolved",    dotColor: STATUS_COLOR.resolved },
];

const STATUS_OPTIONS_3: PillOption<string | null>[] = [
  { label: "Tous",                    value: null },
  { label: STATUS_LABEL.reported,     value: "reported",    dotColor: STATUS_COLOR.reported },
  { label: STATUS_LABEL.in_progress,  value: "in_progress", dotColor: STATUS_COLOR.in_progress },
];

const TODAY = (() => {
  const s = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
})();

// ── Composants partagés ───────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
}) {
  const { isDark } = useAppColors();
  const styles = isDark ? darkStyles : lightStyles;
  return (
    <View style={[styles.statCard, { backgroundColor: color + "1A", borderTopColor: color }]}>
      <View style={[styles.statIconBubble, { backgroundColor: color + "28" }]}>
        <MaterialIcons name={icon} size={15} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  const { isDark, colors } = useAppColors();
  const styles = isDark ? darkStyles : lightStyles;
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIconWrap, { backgroundColor: colors.secondary }]}>
        <MaterialIcons name="inbox" size={26} color={colors.text + "35"} />
      </View>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  const { colors, isDark } = useAppColors();
  const styles = isDark ? darkStyles : lightStyles;
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <View style={[styles.sectionAccent, { backgroundColor: colors.primary }]} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {count !== undefined && (
        <View style={[styles.countBadge, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.countBadgeText, { color: colors.primary }]}>{count}</Text>
        </View>
      )}
    </View>
  );
}

function IncidentList({
  incidents,
  onPress,
  pageSize = INCIDENTS_PAGE_SIZE.list,
  isMine = false,
  myIds,
}: {
  incidents: {
    id: string;
    type: string;
    status: string;
    description?: string;
    address: string | null;
    createdAt: string;
  }[];
  onPress: (id: string) => void;
  pageSize?: number;
  isMine?: boolean;
  myIds?: Set<string>;
}) {
  const { isDark, colors } = useAppColors();
  const styles = isDark ? darkStyles : lightStyles;
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const visible = incidents.slice(0, visibleCount);
  const remaining = incidents.length - visibleCount;

  return (
    <View style={styles.incCard}>
      {visible.map((inc, idx) => (
        <View key={inc.id}>
          {idx > 0 && <View style={styles.incDivider} />}
          <IncidentRow
            id={inc.id}
            type={inc.type}
            status={inc.status}
            description={inc.description}
            address={inc.address}
            createdAt={inc.createdAt}
            onPress={onPress}
            isMine={myIds?.has(inc.id)}
          />
        </View>
      ))}
      {remaining > 0 && (
        <>
          <View style={styles.incDivider} />
          <TouchableOpacity
            style={styles.showMore}
            onPress={() => setVisibleCount((c) => c + pageSize)}
            activeOpacity={0.75}
          >
            <Text style={styles.showMoreText}>
              Afficher {Math.min(remaining, pageSize)} de plus
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}


// ── Vue Citoyen ───────────────────────────────────────────────────────────

function CitizenView({
  incidents,
  allIncidents,
  onPress,
}: {
  incidents: MyIncidentItem[];
  allIncidents: IncidentResponse[];
  onPress: (id: string) => void;
}) {
  const { colors, isDark } = useAppColors();
  const styles = isDark ? darkStyles : lightStyles;

  const [activeTab, setActiveTab] = useState<"mine" | "all">("mine");

  const isMineTab = activeTab === "mine";

  const mineReported   = incidents.filter((i) => i.status === "reported").length;
  const mineInProgress = incidents.filter((i) => i.status === "in_progress").length;
  const mineResolved   = incidents.filter((i) => i.status === "resolved").length;

  const allReported   = allIncidents.filter((i) => i.status === "reported").length;
  const allInProgress = allIncidents.filter((i) => i.status === "in_progress").length;
  const allResolved   = allIncidents.filter((i) => i.status === "resolved").length;

  const reported   = isMineTab ? mineReported   : allReported;
  const inProgress = isMineTab ? mineInProgress : allInProgress;
  const resolved   = isMineTab ? mineResolved   : allResolved;

  const {
    filterType: mineType, setFilterType: setMineType,
    filterStatus: mineStatus, setFilterStatus: setMineStatus,
    filteredIncidents: filteredMine,
  } = useIncidentFilters(incidents);

  const [allType, setAllType] = useState<string | null>(null);
  const [allStatus, setAllStatus] = useState<string | null>(null);
  const filteredAll = useMemo(
    () => applyFilters(allIncidents, allType, allStatus),
    [allIncidents, allType, allStatus],
  );

  const myIdsSet = useMemo(() => new Set(incidents.map((i) => i.id)), [incidents]);

  const mineTypeCount = useMemo(() => {
    const acc: Record<string, number> = {};
    incidents.forEach((i) => { acc[i.type] = (acc[i.type] ?? 0) + 1; });
    return acc;
  }, [incidents]);

  const allTypeCount = useMemo(() => {
    const acc: Record<string, number> = {};
    allIncidents.forEach((i) => { acc[i.type] = (acc[i.type] ?? 0) + 1; });
    return acc;
  }, [allIncidents]);

  const filterType   = isMineTab ? mineType   : allType;
  const setFilterType = isMineTab ? setMineType : setAllType;
  const filterStatus  = isMineTab ? mineStatus  : allStatus;
  const setFilterStatus = isMineTab ? setMineStatus : setAllStatus;
  const typeCount    = isMineTab ? mineTypeCount : allTypeCount;

  return (
    <>
      <SectionHeader title={isMineTab ? "Mes stats" : "Stats communauté"} />
      <View style={styles.statRow}>
        <StatCard label="Déclarés" value={reported}   color="#2196f3" icon="flag" />
        <StatCard label="En cours" value={inProgress} color="#f0a500" icon="autorenew" />
        <StatCard label="Résolus"  value={resolved}   color="#4caf50" icon="check-circle" />
      </View>

      {/* ── Onglets ── */}
      <GlassPillSelector
        options={[
          { label: "Les miens",   value: "mine" as const, badge: incidents.length    || undefined },
          { label: "Communauté",  value: "all"  as const, badge: allIncidents.length || undefined },
        ]}
        activeValue={activeTab}
        onSelect={(v) => setActiveTab(v)}
        style={{ marginBottom: 16 }}
      />

      {/* ── Filtres ── */}
      {Object.keys(typeCount).length > 0 && (
        <View style={styles.typeRow}>
          {Object.entries(typeCount).map(([type, count]) => {
            const active = filterType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.typeChip, active && styles.typeChipActive]}
                onPress={() => setFilterType(active ? null : type)}
                activeOpacity={0.75}
              >
                <Text style={[styles.typeChipCount, active && styles.typeChipActiveText]}>{count}</Text>
                <Text style={[styles.typeChipLabel,  active && styles.typeChipActiveText]}>{TYPE_LABEL[type] ?? type}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <GlassPillSelector
        options={STATUS_OPTIONS_4}
        activeValue={filterStatus}
        onSelect={setFilterStatus}
        style={{ marginBottom: 16 }}
      />

      {/* ── Contenu de l'onglet actif ── */}
      {isMineTab ? (
        filteredMine.length === 0 ? (
          <EmptyState text={incidents.length === 0 ? STRINGS.emptyState.noMyIncidents : STRINGS.emptyState.noFilterResults} />
        ) : (
          <IncidentList
            isMine
            incidents={filteredMine.map((i) => {
              const full = allIncidents.find((a) => a.id === i.id);
              return { id: i.id, type: i.type, status: i.status, description: full?.description ?? i.description, address: i.address_label, createdAt: i.created_at };
            })}
            onPress={onPress}
          />
        )
      ) : (
        filteredAll.length === 0 ? (
          <EmptyState text={allIncidents.length === 0 ? STRINGS.emptyState.noAllIncidents : STRINGS.emptyState.noFilterResults} />
        ) : (
          <IncidentList
            incidents={filteredAll.map((i) => ({ id: i.id, type: i.type, status: i.status, description: i.description, address: i.addressLabel, createdAt: i.createdAt }))}
            onPress={onPress}
            myIds={myIdsSet}
          />
        )
      )}
    </>
  );
}

// ── Vue Agent ─────────────────────────────────────────────────────────────

function AgentView({
  incidents,
  onPress,
}: {
  incidents: IncidentResponse[];
  onPress: (id: string) => void;
}) {
  const { isDark } = useAppColors();
  const styles = isDark ? darkStyles : lightStyles;
  const toHandle = incidents.filter(
    (i) => i.status === "reported" || i.status === "in_progress",
  );
  const reportedCount = toHandle.filter((i) => i.status === "reported").length;
  const inProgressCount = toHandle.filter((i) => i.status === "in_progress").length;

  const { filterType, setFilterType, filterStatus, setFilterStatus, filteredIncidents: filteredToHandle } =
    useIncidentFilters(toHandle);

  const typeCount = useMemo(() => {
    const acc: Record<string, number> = {};
    toHandle.forEach((inc) => { acc[inc.type] = (acc[inc.type] ?? 0) + 1; });
    return acc;
  }, [toHandle]);

  return (
    <>
      <View style={styles.statRow}>
        <StatCard label="À traiter" value={reportedCount}   color="#2196f3" icon="pending-actions" />
        <StatCard label="En cours"  value={inProgressCount} color="#f0a500" icon="autorenew" />
      </View>

      <SectionHeader title="Par catégorie" />
      <View style={styles.typeRow}>
        {Object.entries(typeCount).map(([type, count]) => {
          const active = filterType === type;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.typeChip, active && styles.typeChipActive]}
              onPress={() => setFilterType(active ? null : type)}
              activeOpacity={0.75}
            >
              <Text style={[styles.typeChipCount, active && styles.typeChipActiveText]}>
                {count}
              </Text>
              <Text style={[styles.typeChipLabel, active && styles.typeChipActiveText]}>
                {TYPE_LABEL[type] ?? type}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <GlassPillSelector
        options={STATUS_OPTIONS_3}
        activeValue={filterStatus}
        onSelect={setFilterStatus}
        style={{ marginBottom: 16 }}
      />

      <SectionHeader
        title="Incidents à traiter"
        count={filteredToHandle.length}
      />
      {filteredToHandle.length === 0 ? (
        <EmptyState
          text={
            toHandle.length === 0
              ? STRINGS.emptyState.agentAllDone
              : STRINGS.emptyState.noFilterResults
          }
        />
      ) : (
        <IncidentList
          incidents={filteredToHandle.map((i) => ({
            id: i.id,
            type: i.type,
            status: i.status,
            description: i.description,
            address: i.addressLabel,
            createdAt: i.createdAt,
          }))}
          onPress={onPress}
        />
      )}
    </>
  );
}

// ── Vue Admin ─────────────────────────────────────────────────────────────

function AdminView({
  incidents,
  onPress,
}: {
  incidents: IncidentResponse[];
  onPress: (id: string) => void;
}) {
  const { isDark } = useAppColors();
  const styles = isDark ? darkStyles : lightStyles;
  const reported = incidents.filter((i) => i.status === "reported").length;
  const inProgress = incidents.filter((i) => i.status === "in_progress").length;
  const resolved = incidents.filter((i) => i.status === "resolved").length;

  const { filterType, setFilterType, filterStatus, setFilterStatus, filteredIncidents } =
    useIncidentFilters(incidents);

  const typeCount = useMemo(() => {
    const acc: Record<string, number> = {};
    incidents.forEach((inc) => { acc[inc.type] = (acc[inc.type] ?? 0) + 1; });
    return acc;
  }, [incidents]);

  return (
    <>
      <View style={styles.statRow}>
        <StatCard label="Déclarés" value={reported}    color="#2196f3" icon="flag" />
        <StatCard label="En cours" value={inProgress}  color="#f0a500" icon="autorenew" />
        <StatCard label="Résolus"  value={resolved}    color="#4caf50" icon="check-circle" />
      </View>
      <Text style={styles.totalLabel}>
        {incidents.length} signalement{incidents.length !== 1 ? "s" : ""} au
        total
      </Text>

      <SectionHeader title="Par catégorie" />
      <View style={styles.typeRow}>
        {Object.entries(typeCount).map(([type, count]) => {
          const active = filterType === type;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.typeChip, active && styles.typeChipActive]}
              onPress={() => setFilterType(active ? null : type)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.typeChipCount,
                  active && styles.typeChipActiveText,
                ]}
              >
                {count}
              </Text>
              <Text
                style={[
                  styles.typeChipLabel,
                  active && styles.typeChipActiveText,
                ]}
              >
                {TYPE_LABEL[type] ?? type}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <GlassPillSelector
        options={STATUS_OPTIONS_4}
        activeValue={filterStatus}
        onSelect={setFilterStatus}
        style={{ marginBottom: 16 }}
      />

      <SectionHeader title="Signalements" count={filteredIncidents.length} />
      {filteredIncidents.length === 0 ? (
        <EmptyState
          text={
            incidents.length === 0
              ? STRINGS.emptyState.noIncidents
              : STRINGS.emptyState.noFilterResults
          }
        />
      ) : (
        <IncidentList
          incidents={filteredIncidents.map((i) => ({
            id: i.id,
            type: i.type,
            status: i.status,
            description: i.description,
            address: i.addressLabel,
            createdAt: i.createdAt,
          }))}
          onPress={onPress}
        />
      )}
    </>
  );
}

// ── Écran principal ────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { colors, isDark } = useAppColors();
  const styles = isDark ? darkStyles : lightStyles;
  const { role, firstName, loading: authLoading } = useAuth();
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [myIncidents, setMyIncidents] = useState<MyIncidentItem[]>([]);
  const [allIncidents, setAllIncidents] = useState<IncidentResponse[]>([]);

  const { active: dogActive, onTap: onLogoTap, dismiss: dismissDog } = useEasterEgg();

  const load = useCallback(async (isRefresh = false) => {
    if (role === null) return;
    if (isRefresh) setRefreshing(true);
    else setIncidentsLoading(true);

    try {
      const token = await getValidToken();
      if (!token) return;

      if (role === "Citizen") {
        const [myRes, allRes] = await Promise.all([
          getMyIncidents(token),
          getIncidents({ pageSize: INCIDENTS_PAGE_SIZE.load }),
        ]);
        setMyIncidents(myRes.data);
        setAllIncidents(allRes.data);
      } else {
        const res = await getIncidents({ pageSize: INCIDENTS_PAGE_SIZE.load });
        setAllIncidents(res.data);
      }
    } catch {
      // silencieux
    } finally {
      setIncidentsLoading(false);
      setRefreshing(false);
    }
  }, [role]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const navigateToIncident = useCallback((id: string) => {
    router.navigate({
      pathname: "/(tabs)/explore",
      params: { selectId: id },
    });
  }, []);

  const insets = useSafeAreaInsets();

  if (authLoading || incidentsLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: getTabBarScrollPadding(insets.bottom) }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header card */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTag}>CityCare+</Text>
            <Text style={styles.greeting}>
              {firstName ? `Bonjour, ${firstName}` : "Bonjour"}
            </Text>
            <Text style={styles.headerDate}>{TODAY}</Text>
          </View>
          <TouchableOpacity onPress={onLogoTap} activeOpacity={1}>
            <Logo size={78} />
          </TouchableOpacity>
        </View>
        {role && (
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{ROLE_LABELS[role] ?? role}</Text>
          </View>
        )}
        {role === "Citizen" && (
          <TouchableOpacity style={styles.reportShortcut} onPress={() => router.push("/report")} activeOpacity={0.8}>
            <MaterialIcons name="add-circle-outline" size={16} color="#fff" />
            <Text style={styles.reportShortcutText}>Signaler un incident</Text>
            <MaterialIcons name="chevron-right" size={16} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        )}
      </View>

      {role === "Citizen" && (
        <CitizenView
          incidents={myIncidents}
          allIncidents={allIncidents}
          onPress={navigateToIncident}
        />
      )}
      {role === "Agent" && (
        <AgentView incidents={allIncidents} onPress={navigateToIncident} />
      )}
      {role === "Admin" && (
        <AdminView incidents={allIncidents} onPress={navigateToIncident} />
      )}
    </ScrollView>

    <EasterEggDog visible={dogActive} onHide={dismissDog} />
    </>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    centered: {
      flex: 1,
      backgroundColor: c.background,
      justifyContent: "center",
      alignItems: "center",
    },
    scroll: { flex: 1, backgroundColor: c.background },
    content: { padding: 20, paddingBottom: 40 },
    headerCard: {
      backgroundColor: c.primary,
      borderRadius: 20,
      padding: 22,
      marginBottom: 20,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    },
    headerRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
    headerTag: {
      fontSize: 11,
      fontWeight: "700",
      color: "rgba(255,255,255,0.65)",
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginBottom: 4,
    },
    greeting: { fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 2 },
    headerDate: { fontSize: 13, color: "rgba(255,255,255,0.6)" },
    rolePill: {
      alignSelf: "flex-start",
      backgroundColor: "rgba(255,255,255,0.22)",
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    rolePillText: { fontSize: 12, fontWeight: "700", color: "#fff" },
    statRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
    statCard: { flex: 1, borderRadius: 12, borderTopWidth: 3, padding: 14, alignItems: "center" },
    statIconBubble: {
      width: 28, height: 28, borderRadius: 8,
      alignItems: "center", justifyContent: "center",
      marginBottom: 8,
    },
    statValue: { fontSize: 28, fontWeight: "800", marginBottom: 2 },
    statLabel: {
      fontSize: 11,
      color: c.text,
      opacity: 0.5,
      textAlign: "center",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    reportShortcut: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "rgba(255,255,255,0.18)",
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginTop: 12,
    },
    reportShortcutText: { fontSize: 14, fontWeight: "600", color: "#fff", flex: 1 },
    totalLabel: {
      fontSize: 13,
      color: c.text,
      opacity: 0.5,
      textAlign: "center",
      marginTop: -14,
      marginBottom: 20,
    },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sectionAccent: {
      width: 3,
      height: 18,
      borderRadius: 2,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: c.text,
    },
    tabBar: {
      flexDirection: "row",
      borderRadius: 14,
      backgroundColor: c.secondary,
      padding: 3,
      marginBottom: 16,
    },
    tab: {
      flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
      paddingVertical: 10, borderRadius: 11, gap: 6,
    },
    tabActive: { backgroundColor: c.white },
    tabText: { fontSize: 13, fontWeight: "600", color: c.text, opacity: 0.4 },
    tabTextActive: { opacity: 1 },
    tabBadge: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, minWidth: 22, alignItems: "center" },
    tabBadgeText: { fontSize: 11, fontWeight: "700" },
    typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
    typeChip: {
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: c.white,
      borderWidth: 1,
      borderColor: c.chipBorder,
    },
    typeChipActive: { backgroundColor: c.primary, borderColor: c.primary },
    typeChipActiveText: { color: "#fff" },
    typeChipCount: { fontSize: 14, fontWeight: "800", color: c.primary },
    typeChipLabel: { fontSize: 13, color: c.text, fontWeight: "500" },
    incCard: {
      backgroundColor: c.white,
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 6,
      elevation: 3,
    },
    incDivider: { height: 1, backgroundColor: c.background, marginHorizontal: 0 },
    empty: {
      backgroundColor: c.white,
      borderRadius: 12,
      padding: 28,
      alignItems: "center",
      gap: 10,
      marginBottom: 20,
    },
    emptyIconWrap: {
      width: 52, height: 52, borderRadius: 16,
      alignItems: "center", justifyContent: "center",
    },
    emptyText: { fontSize: 14, color: c.text, opacity: 0.5, textAlign: "center" },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
      marginTop: 10,
    },
    countBadge: {
      borderRadius: 10,
      paddingHorizontal: 9,
      paddingVertical: 3,
    },
    countBadgeText: { fontSize: 12, fontWeight: "700" },
    showMore: { paddingVertical: 14, paddingHorizontal: 14, alignItems: "center" },
    showMoreText: { fontSize: 13, fontWeight: "700", color: c.primary },
  });
}

const lightStyles = makeStyles(CityCareColors);
const darkStyles = makeStyles(CityCareColorsDark);
