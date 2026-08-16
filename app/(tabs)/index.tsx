import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { IncidentRow } from "@/components/incident-row";
import { IncidentSearchBar, NoSearchResults } from "@/components/incident-search-bar";
import { PersonalStatsCard } from "@/components/personal-stats-card";
import { StatusBreakdown } from "@/components/status-breakdown";
import { useCityStats } from "@/hooks/use-city-stats";
import { useFollowedAlerts } from "@/hooks/use-followed-alerts";
import { useFollowedIncidents } from "@/hooks/use-followed-incidents";
import { FeedSkeleton } from "@/components/ui/Skeleton";
import { useIncidentSearch } from "@/hooks/use-incident-search";
import { HeaderClock } from "@/components/ui/HeaderClock";
import { Logo } from "@/components/ui/Logo";
import { STATUS_COLOR, STATUS_LABEL, TYPE_LABEL } from "@/constants/incidents";
import { ROLE_LABELS } from "@/constants/roles";
import { CityCareColors, CityCareColorsDark } from "@/constants/theme";
import { getTabBarScrollPadding } from "@/utils/layout";
import { GlassPillSelector, PillOption } from "@/components/ui/GlassPillSelector";
import { useAuth } from "@/context/AuthContext";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { useAppMenu } from "@/context/AppMenuContext";
import { useAppRefreshControl } from "@/components/ui/AppRefreshControl";
import { useAppUpdate } from "@/hooks/use-app-update";
import { useDraftCount } from "@/hooks/use-draft-indicator";
import { useWeather } from "@/hooks/use-weather";
import { formatTemperature, weatherIcon } from "@/utils/weather-code";
import { useStrings } from "@/hooks/use-strings";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { Toast } from "@/components/ui/ToastMessage";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { INCIDENTS_PAGE_SIZE, POLL_INTERVAL_MS } from "@/constants/config";
import { applyFilters, useIncidentFilters } from "@/hooks/use-incident-filters";
import { getIncidents } from "@/services/incidents";
import { getMyIncidents } from "@/services/users";
import { getValidToken } from "@/storage/tokens";
import { loadIncidentsCache, saveIncidentsCache } from "@/storage/incidents-cache";
import { usePendingReports } from "@/hooks/use-pending-reports";
import { timeAgo } from "@/utils/format-date";
import type { Paging } from "@/hooks/use-incidents-paging";
import { useIncidentsPaging } from "@/hooks/use-incidents-paging";
import type { IncidentResponse } from "@/types/incidents";
import type { MyIncidentItem } from "@/types/users";
import { EasterEggDog } from "@/components/easter-egg-dog";
import { useEasterEgg } from "@/hooks/use-easter-egg";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Construites au rendu et non au chargement du module : le libellé « Tous » suit
 * la langue, et une constante de module l'aurait figé à l'import — donc au
 * français, quoi que choisisse l'utilisateur ensuite.
 */
function statusOptions(all: string, withResolved: boolean): PillOption<string | null>[] {
  const options: PillOption<string | null>[] = [
    { label: all,                       value: null },
    { label: STATUS_LABEL.reported,     value: "reported",    dotColor: STATUS_COLOR.reported },
    { label: STATUS_LABEL.in_progress,  value: "in_progress", dotColor: STATUS_COLOR.in_progress },
  ];
  if (withResolved) {
    options.push({ label: STATUS_LABEL.resolved, value: "resolved", dotColor: STATUS_COLOR.resolved });
  }
  return options;
}

/**
 * Date du jour, dans la langue active.
 *
 * C'était une constante de module : calculée une fois au chargement, donc figée
 * en français — et accessoirement jamais mise à jour si l'application restait
 * ouverte au passage de minuit.
 */
function today(locale: string): string {
  const label = new Date().toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  // Les jours de la semaine sont déjà capitalisés en anglais ; en français,
  // `toLocaleDateString` rend « dimanche ».
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Compte les trois statuts en une seule passe. */
function countByStatus(incidents: { status: string }[]) {
  let reported = 0, inProgress = 0, resolved = 0;
  for (const { status } of incidents) {
    if (status === "reported") reported++;
    else if (status === "in_progress") inProgress++;
    else if (status === "resolved") resolved++;
  }
  return { reported, inProgress, resolved };
}

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

/**
 * Le pendant du bouton de `IncidentList` pour les cas où il n'y a pas de liste
 * à prolonger : un filtre qui ne trouve rien dans les pages déjà ouvertes n'est
 * pas une réponse, tant qu'il en reste à ouvrir.
 */
function LoadMore({ paging }: { paging: Paging }) {
  const { colors, isDark } = useAppColors();
  const t = useStrings();
  const styles = isDark ? darkStyles : lightStyles;
  if (!paging.hasMore) return null;

  return (
    <View style={styles.incCard}>
      <TouchableOpacity
        style={styles.showMore}
        onPress={paging.onLoadMore}
        disabled={paging.loadingMore}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={t.home.loadMoreA11y}
      >
        {paging.loadingMore ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={styles.showMoreText}>{t.home.loadMore}</Text>
        )}
      </TouchableOpacity>
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

/**
 * `onLoadMore` prolonge la liste au-delà de ce que le serveur a déjà donné. Le
 * bouton conduit donc deux gestes derrière une seule apparence : dérouler ce
 * qu'on tient en mémoire, puis, une fois au bout, aller chercher la page
 * suivante. L'utilisateur n'a pas à connaître cette frontière — il veut voir
 * plus loin, c'est tout.
 */
function IncidentList({
  incidents,
  onPress,
  pageSize = INCIDENTS_PAGE_SIZE.list,
  isMine = false,
  myIds,
  followedIds,
  onLoadMore,
  loadingMore = false,
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
  followedIds?: Set<string>;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}) {
  const { isDark, colors } = useAppColors();
  const styles = isDark ? darkStyles : lightStyles;
  const t = useStrings();
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const visible = incidents.slice(0, visibleCount);
  const remaining = incidents.length - visibleCount;
  const canFetchMore = remaining <= 0 && onLoadMore !== undefined;

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
            isFollowed={followedIds?.has(inc.id)}
          />
        </View>
      ))}
      {(remaining > 0 || canFetchMore) && (
        <>
          <View style={styles.incDivider} />
          <TouchableOpacity
            style={styles.showMore}
            onPress={() => {
              if (remaining > 0) setVisibleCount((c) => c + pageSize);
              else onLoadMore?.();
            }}
            disabled={loadingMore}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t.home.showMoreA11y}
          >
            {loadingMore ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.showMoreText}>
                {remaining > 0
                  ? t.home.showMore(Math.min(remaining, pageSize))
                  : t.home.loadMore}
              </Text>
            )}
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
  paging,
}: {
  incidents: MyIncidentItem[];
  allIncidents: IncidentResponse[];
  onPress: (id: string) => void;
  paging: Paging;
}) {
  const { isDark } = useAppColors();
  const styles = isDark ? darkStyles : lightStyles;
  const t = useStrings();

  const [activeTab, setActiveTab] = useState<"mine" | "all">("mine");

  const isMineTab = activeTab === "mine";

  // Une passe par jeu plutôt que trois, et seulement quand les données bougent.
  const mineCounts = useMemo(() => countByStatus(incidents), [incidents]);
  const allCounts = useMemo(() => countByStatus(allIncidents), [allIncidents]);

  const { reported, inProgress, resolved } = isMineTab ? mineCounts : allCounts;

  const {
    filterType: mineType, setFilterType: setMineType,
    filterStatus: mineStatus, setFilterStatus: setMineStatus,
    filteredIncidents: filteredMine,
  } = useIncidentFilters(incidents, "mine");

  const [allType, setAllType] = useState<string | null>(null);
  const [allStatus, setAllStatus] = useState<string | null>(null);
  const filteredAll = useMemo(
    () => applyFilters(allIncidents, allType, allStatus),
    [allIncidents, allType, allStatus],
  );
  // La recherche s'applique après les filtres : elle cherche dans ce qui est
  // affiché, pas dans ce qui a été écarté.
  const cityStats = useCityStats();
  const search = useIncidentSearch(filteredAll);
  // Le même outil sur ses propres signalements : s'en passer sous prétexte
  // qu'ils sont moins nombreux, c'est décider à la place de qui en a trente.
  const mineSearch = useIncidentSearch(
    useMemo(
      () =>
        filteredMine.map((incident) => ({
          ...incident,
          // La description ne vient pas de cette liste — le serveur ne la
          // projette pas — mais du fil de la ville, où elle figure. Sans ça,
          // chercher un mot de sa propre description ne donnait rien.
          description: allIncidents.find((i) => i.id === incident.id)?.description ?? incident.description,
          addressLabel: incident.address_label,
          createdAt: incident.created_at,
        })),
      [filteredMine, allIncidents],
    ),
  );

  const myIdsSet = useMemo(() => new Set(incidents.map((i) => i.id)), [incidents]);
  const { followed } = useFollowedIncidents();
  // Le fil est relu toutes les quinze secondes : c'est là qu'un changement se
  // remarque, sans rien demander au serveur.
  useFollowedAlerts(allIncidents, followed);

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
      {/* Un seul bloc de chiffres par onglet.
          Les trois compteurs et le bilan disaient exactement la même chose sur
          « les miens » — déclarés, en cours, résolus, deux fois de suite et à
          deux endroits. Le bilan les contient et va plus loin : il reste seul.
          La communauté, elle, n'a pas de bilan à raconter, elle garde ses
          compteurs. */}
      {isMineTab ? (
        <PersonalStatsCard incidents={incidents} />
      ) : (
        /* Les compteurs de la ville portaient sur les pages chargées : ils
           annonçaient « 50 déclarés » parce que cinquante incidents étaient en
           mémoire. `map-summary` couvre la ville entière et ventile déjà par
           statut — une requête, et le chiffre devient vrai. En son absence, on
           retombe sur ce qu'on a, plutôt que sur rien. */
        <StatusBreakdown
          title={t.stats.cityTitle}
          icon="location-city"
          total={cityStats?.total ?? allIncidents.length}
          resolved={cityStats?.resolved ?? resolved}
          inProgress={cityStats?.inProgress ?? inProgress}
          reported={cityStats?.reported ?? reported}
        />
      )}

      {/* ── Onglets ── */}
      <GlassPillSelector
        options={[
          { label: t.home.tabMine,      value: "mine" as const, badge: incidents.length   || undefined },
          // Le total du serveur, pas la taille de ce qu'on a chargé : l'onglet
          // annonce la communauté, pas la pagination.
          { label: t.home.tabCommunity, value: "all"  as const, badge: paging.totalCount || undefined },
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
        options={statusOptions(t.home.allFilter, true)}
        activeValue={filterStatus}
        onSelect={setFilterStatus}
        style={{ marginBottom: 16 }}
      />

      <IncidentSearchBar
        query={isMineTab ? mineSearch.query : search.query}
        onQueryChange={isMineTab ? mineSearch.setQuery : search.setQuery}
        sort={isMineTab ? mineSearch.sort : search.sort}
        onSortChange={(next) => void (isMineTab ? mineSearch.setSort(next) : search.setSort(next))}
      />

      {/* ── Contenu de l'onglet actif ── */}
      {isMineTab ? (
        mineSearch.results.length === 0 ? (
          mineSearch.query.trim()
            ? <NoSearchResults query={mineSearch.query} />
            : <EmptyState text={incidents.length === 0 ? t.emptyState.noMyIncidents : t.emptyState.noFilterResults} />
        ) : (
          <IncidentList
            isMine
            followedIds={followed}
            incidents={mineSearch.results.map((i) => {
              const full = allIncidents.find((a) => a.id === i.id);
              return {
                id: i.id,
                type: i.type,
                status: i.status,
                description: full?.description ?? i.description,
                address: i.addressLabel,
                createdAt: i.createdAt,
              };
            })}
            onPress={onPress}
          />
        )
      ) : (
        search.results.length === 0 ? (
          <>
            {search.query.trim()
              ? <NoSearchResults query={search.query} />
              : <EmptyState text={allIncidents.length === 0 ? t.emptyState.noAllIncidents : t.emptyState.noFilterResults} />}
            <LoadMore paging={paging} />
          </>
        ) : (
          <IncidentList
            incidents={search.results.map((i) => ({ id: i.id, type: i.type, status: i.status, description: i.description, address: i.addressLabel, createdAt: i.createdAt }))}
            onPress={onPress}
            myIds={myIdsSet}
            followedIds={followed}
            onLoadMore={paging.hasMore ? paging.onLoadMore : undefined}
            loadingMore={paging.loadingMore}
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
  paging,
}: {
  incidents: IncidentResponse[];
  onPress: (id: string) => void;
  paging: Paging;
}) {
  const { isDark } = useAppColors();
  const styles = isDark ? darkStyles : lightStyles;
  const t = useStrings();
  // Sans mémoïsation, ce tableau était recréé à chaque rendu — et comme
  // `typeCount` en dépend, son `useMemo` ne servait à rien : il recalculait à
  // tous les coups.
  const toHandle = useMemo(
    () => incidents.filter((i) => i.status === "reported" || i.status === "in_progress"),
    [incidents],
  );
  const { reported: reportedCount, inProgress: inProgressCount } = useMemo(
    () => countByStatus(toHandle),
    [toHandle],
  );

  const { filterType, setFilterType, filterStatus, setFilterStatus, filteredIncidents: filteredToHandle } =
    useIncidentFilters(toHandle, "agent");
  const search = useIncidentSearch(filteredToHandle);

  const typeCount = useMemo(() => {
    const acc: Record<string, number> = {};
    toHandle.forEach((inc) => { acc[inc.type] = (acc[inc.type] ?? 0) + 1; });
    return acc;
  }, [toHandle]);

  return (
    <>
      <View style={styles.statRow}>
        <StatCard label={t.home.toHandle} value={reportedCount}   color="#2196f3" icon="pending-actions" />
        <StatCard label={t.home.inProgress}  value={inProgressCount} color="#f0a500" icon="autorenew" />
      </View>

      <SectionHeader title={t.home.byCategory} />
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
        options={statusOptions(t.home.allFilter, false)}
        activeValue={filterStatus}
        onSelect={setFilterStatus}
        style={{ marginBottom: 16 }}
      />

      <SectionHeader
        title={t.home.incidentsToHandle}
        count={search.results.length}
      />
      <IncidentSearchBar
        query={search.query}
        onQueryChange={search.setQuery}
        sort={search.sort}
        onSortChange={(next) => void search.setSort(next)}
      />
      {search.results.length === 0 ? (
        <>
          {search.query.trim() ? (
            <NoSearchResults query={search.query} />
          ) : (
            <EmptyState
              text={toHandle.length === 0 ? t.emptyState.agentAllDone : t.emptyState.noFilterResults}
            />
          )}
          <LoadMore paging={paging} />
        </>
      ) : (
        <IncidentList
          incidents={search.results.map((i) => ({
            id: i.id,
            type: i.type,
            status: i.status,
            description: i.description,
            address: i.addressLabel,
            createdAt: i.createdAt,
          }))}
          onPress={onPress}
          onLoadMore={paging.hasMore ? paging.onLoadMore : undefined}
          loadingMore={paging.loadingMore}
        />
      )}
    </>
  );
}

// ── Vue Admin ─────────────────────────────────────────────────────────────

function AdminView({
  incidents,
  onPress,
  paging,
}: {
  incidents: IncidentResponse[];
  onPress: (id: string) => void;
  paging: Paging;
}) {
  const { isDark } = useAppColors();
  const styles = isDark ? darkStyles : lightStyles;
  const t = useStrings();
  const { reported, inProgress, resolved } = useMemo(() => countByStatus(incidents), [incidents]);

  const { filterType, setFilterType, filterStatus, setFilterStatus, filteredIncidents } =
    useIncidentFilters(incidents, "admin");
  const search = useIncidentSearch(filteredIncidents);

  const typeCount = useMemo(() => {
    const acc: Record<string, number> = {};
    incidents.forEach((inc) => { acc[inc.type] = (acc[inc.type] ?? 0) + 1; });
    return acc;
  }, [incidents]);

  return (
    <>
      <View style={styles.statRow}>
        <StatCard label={t.home.reported} value={reported}    color="#2196f3" icon="flag" />
        <StatCard label={t.home.inProgress} value={inProgress}  color="#f0a500" icon="autorenew" />
        <StatCard label={t.home.resolved}  value={resolved}    color="#4caf50" icon="check-circle" />
      </View>
      {/* « au total » veut dire au total : c'est le compte du serveur, pas
          celui des pages ouvertes — qui annonçait 50 quoi qu'il arrive. */}
      <Text style={styles.totalLabel}>{t.home.totalReports(paging.totalCount)}</Text>

      <SectionHeader title={t.home.byCategory} />
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
        options={statusOptions(t.home.allFilter, true)}
        activeValue={filterStatus}
        onSelect={setFilterStatus}
        style={{ marginBottom: 16 }}
      />

      <SectionHeader title={t.home.reports} count={search.results.length} />
      <IncidentSearchBar
        query={search.query}
        onQueryChange={search.setQuery}
        sort={search.sort}
        onSortChange={(next) => void search.setSort(next)}
      />
      {search.results.length === 0 ? (
        <>
          {search.query.trim() ? (
            <NoSearchResults query={search.query} />
          ) : (
            <EmptyState
              text={incidents.length === 0 ? t.emptyState.noIncidents : t.emptyState.noFilterResults}
            />
          )}
          <LoadMore paging={paging} />
        </>
      ) : (
        <IncidentList
          incidents={search.results.map((i) => ({
            id: i.id,
            type: i.type,
            status: i.status,
            description: i.description,
            address: i.addressLabel,
            createdAt: i.createdAt,
          }))}
          onPress={onPress}
          onLoadMore={paging.hasMore ? paging.onLoadMore : undefined}
          loadingMore={paging.loadingMore}
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
  const [failed, setFailed] = useState(false);
  const [myIncidents, setMyIncidents] = useState<MyIncidentItem[]>([]);
  const {
    incidents: allIncidents,
    receiveFirstPage,
    seed,
    loadMore,
    totalCount,
    loadingMore,
    hasMore,
  } = useIncidentsPaging();
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const { pending, rejected, flush, dismissRejected } = usePendingReports();

  const { active: dogActive, onTap: onLogoTap, dismiss: dismissDog } = useEasterEgg();
  const { open: openMenu } = useAppMenu();
  const draftCount = useDraftCount();
  const hasDraft = draftCount > 0;
  const weather = useWeather();
  const t = useStrings();
  const { ready: updateReady } = useAppUpdate();

  // Le dernier état connu, le temps que le réseau réponde — et à la place de
  // l'écran vide s'il ne répond pas.
  useEffect(() => {
    void (async () => {
      const cache = await loadIncidentsCache();
      if (cache) {
        seed(cache.incidents, cache.totalCount);
        setCachedAt(cache.savedAt);
      }
    })();
  }, [seed]);

  const load = useCallback(async (isRefresh = false, silent = false) => {
    if (role === null) return;
    if (!silent) {
      if (isRefresh) setRefreshing(true);
      else setIncidentsLoading(true);
    }

    try {
      const token = await getValidToken();
      if (!token) return;

      // Une seule page relue, jamais toutes celles déjà ouvertes : un
      // rafraîchissement silencieux part toutes les quinze secondes, et le
      // multiplier par le nombre de pages déroulées se paierait en batterie
      // autant qu'en charge serveur. Un tiré-pour-rafraîchir, lui, repart de
      // zéro — c'est le geste par lequel on demande explicitement du propre.
      const firstPage = getIncidents({ page: 1, pageSize: INCIDENTS_PAGE_SIZE.load });
      const [myRes, allRes] = await Promise.all([
        role === "Citizen" ? getMyIncidents(token) : Promise.resolve(null),
        firstPage,
      ]);

      if (myRes) setMyIncidents(myRes.data);
      // Seul le tiré-pour-rafraîchir referme les pages ouvertes : c'est le
      // geste par lequel on demande explicitement du propre.
      receiveFirstPage(allRes, { reset: isRefresh });
      setFailed(false);
      setCachedAt(null);
      void saveIncidentsCache(allRes.data, allRes.pagination.total_count);
      // Le réseau vient de répondre : c'est le meilleur moment pour rejouer ce
      // qui attendait, et un signal plus fiable qu'un indicateur de connexion.
      // Le bandeau « en attente » disparaîtrait sinon sans un mot, et rien ne
      // dirait à l'utilisateur si son signalement est parti ou s'il a été perdu.
      void flush().then((sent) => {
        if (sent === 0) return;
        Toast.show({
          type: "success",
          text1: t.home.sentReports(sent),
          text2: t.home.sentReportsDetail,
        });
      });
    } catch {
      setFailed(true);
    } finally {
      if (!silent) {
        setIncidentsLoading(false);
        setRefreshing(false);
      }
    }
  }, [role, receiveFirstPage, flush, t.home]);

  const paging = useMemo<Paging>(
    () => ({
      totalCount,
      hasMore,
      loadingMore,
      onLoadMore: () => void loadMore().then((ok) => setFailed(!ok)),
    }),
    [totalCount, hasMore, loadingMore, loadMore],
  );

  // Recharge à l'arrivée sur l'écran puis en silence, et resserre la cadence
  // tant qu'un chargement échoue — c'est ce qui rattrape le retour du réseau.
  useAutoRefresh(
    useCallback((silent: boolean) => void load(false, silent), [load]),
    { interval: POLL_INTERVAL_MS.incidents, failed, enabled: role !== null },
  );

  const navigateToIncident = useCallback((id: string) => {
    router.navigate({
      pathname: "/(tabs)/explore",
      params: { selectId: id },
    });
  }, []);

  const insets = useSafeAreaInsets();

  // Avant le retour anticipé qui suit : c'est un crochet.
  const refreshControl = useAppRefreshControl({
    refreshing,
    onRefresh: () => void load(true),
    offset: insets.top,
  });

  // Voile plein réservé au premier chargement : il effaçait l'écran entier à
  // chaque retour sur l'onglet, alors qu'il y avait déjà quelque chose à voir.
  const hasContent = allIncidents.length > 0 || myIncidents.length > 0;
  if (authLoading || (incidentsLoading && !hasContent)) {
    return (
      <View style={[styles.scroll, styles.content, { paddingTop: insets.top + 12 }]}>
        <FeedSkeleton />
      </View>
    );
  }

  return (
    <>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: getTabBarScrollPadding(insets.bottom) }]}
      refreshControl={refreshControl}
    >
      {failed && (
        <ErrorNotice
          detail={
            cachedAt
              ? t.home.cachedData(timeAgo(cachedAt))
              : t.home.staleData
          }
          onRetry={() => void load(true)}
        />
      )}

      {pending.length > 0 && (
        <View style={styles.pendingNotice} testID="pending-notice">
          <MaterialIcons name="cloud-upload" size={18} color={colors.primary} />
          <Text style={styles.pendingText}>{t.home.pendingReports(pending.length)}</Text>
        </View>
      )}

      {rejected.length > 0 && (
        <ErrorNotice
          title={t.home.rejectedReports(rejected.length)}
          detail={rejected[0].reason}
          onRetry={() => void dismissRejected()}
          actionLabel={t.home.acknowledge}
        />
      )}

      {/* En-tête ─────────────────────────────────────────────────────────
          Trois étages, du service à l'identité puis au contexte : la rangée
          d'outils (heure, menu) que l'œil traverse, la salutation qui porte le
          bloc, et la météo posée dessous comme une donnée et non comme une
          phrase. Le nom de la marque a disparu du texte : le logo le dit déjà,
          à dix pixels de là. */}
      <View style={styles.headerCard}>
        <View style={styles.utilityRow}>
          <HeaderClock />
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={openMenu}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t.menu.open}
          >
            <MaterialIcons name="menu" size={19} color="#fff" />
            {/* La bannière de mise à jour ne passe qu'une fois ; cette
                pastille, elle, reste jusqu'à ce qu'on s'en occupe. */}
            {updateReady && <View style={styles.menuDot} />}
          </TouchableOpacity>
        </View>

        <View style={styles.headerRow}>
          <View style={styles.identity}>
            <View style={styles.metaRow}>
              <Text style={styles.greeting} numberOfLines={1}>
                {firstName ? t.home.greetingNamed(firstName) : t.home.greeting}
              </Text>
              {/* Le badge accompagne le prénom, pas la date : il dit qui on est,
                  pas quand on est.

                  Et il ne paraît que pour un agent ou un administrateur.
                  « Citoyen » est le rôle par défaut : l'annoncer à un citoyen
                  n'apprend rien et occupe la place. Un agent, lui, a besoin de
                  savoir sous quelle casquette il regarde — son écran n'est pas
                  le même. */}
              {role && role !== "Citizen" && (
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>{ROLE_LABELS[role] ?? role}</Text>
                </View>
              )}
            </View>
            <Text style={styles.headerDate}>{today(t.locale)}</Text>
          </View>
          <TouchableOpacity onPress={onLogoTap} activeOpacity={1}>
            <Logo size={72} />
          </TouchableOpacity>
        </View>

        {/* La météo n'apparaît que lorsqu'elle a quelque chose à dire : une
            ligne qui clignote entre un chargement, une erreur et une
            température vaut moins que pas de météo du tout. */}
        {weather && (
          <View style={styles.weatherChip}>
            <MaterialIcons
              name={weatherIcon(weather.condition, weather.isDay)}
              size={15}
              color="#fff"
            />
            <Text style={styles.weatherTemp}>{formatTemperature(weather.temperature)}</Text>
            <Text style={styles.weatherLabel} numberOfLines={1}>
              {weather.city
                ? `${t.weather[weather.condition]} · ${weather.city}`
                : t.weather[weather.condition]}
            </Text>
          </View>
        )}

        {role === "Citizen" && (
          <TouchableOpacity style={styles.reportShortcut} onPress={() => router.push("/report")} activeOpacity={0.8}>
            <MaterialIcons name="add-circle-outline" size={16} color="#fff" />
            <Text style={styles.reportShortcutText}>
              {hasDraft ? t.home.resumeReport : t.home.reportIncident}
            </Text>
            {/* Le brouillon se restaure tout seul, mais rien ne le disait avant
                d'ouvrir le formulaire : on pouvait l'avoir oublié. */}
            {hasDraft && (
              <View style={styles.draftPill}>
                <Text style={styles.draftPillText}>
                  {draftCount > 1 ? `${t.home.draftBadge} · ${draftCount}` : t.home.draftBadge}
                </Text>
              </View>
            )}
            <MaterialIcons name="chevron-right" size={16} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        )}
      </View>

      {role === "Citizen" && (
        <CitizenView
          incidents={myIncidents}
          allIncidents={allIncidents}
          onPress={navigateToIncident}
          paging={paging}
        />
      )}
      {role === "Agent" && (
        <AgentView incidents={allIncidents} onPress={navigateToIncident} paging={paging} />
      )}
      {role === "Admin" && (
        <AdminView incidents={allIncidents} onPress={navigateToIncident} paging={paging} />
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
    // Information, pas alerte : ces signalements ne sont pas perdus, ils
    // attendent. Le ton reste celui de la marque, pas celui d'une erreur.
    pendingNotice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      borderRadius: 14,
      marginBottom: 16,
      backgroundColor: c.primary + "14",
      borderWidth: 1,
      borderColor: c.primary + "33",
    },
    pendingText: { flex: 1, fontSize: 12, color: c.text, opacity: 0.75 },
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
    utilityRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
    headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    identity: { flex: 1, gap: 7 },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    // La météo reprend la pastille de l'horloge : les deux encadrent le bloc et
    // se lisent comme des données, pas comme des phrases.
    weatherChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      alignSelf: "flex-start",
      marginTop: 14,
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.16)",
    },
    weatherTemp: {
      fontSize: 14,
      fontWeight: "800",
      color: "#fff",
      fontVariant: ["tabular-nums"],
    },
    weatherLabel: { fontSize: 12.5, color: "rgba(255,255,255,0.8)", flexShrink: 1 },
    menuBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.18)",
    },
    menuDot: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#fff",
      borderWidth: 1.5,
      borderColor: c.primary,
    },
    greeting: { fontSize: 25, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
    headerDate: { fontSize: 13, color: "rgba(255,255,255,0.6)" },
    // Le rôle rejoint la date sur la même ligne : posé seul, il ouvrait un
    // quatrième étage dans un bloc qui en comptait déjà trois.
    rolePill: {
      backgroundColor: "rgba(255,255,255,0.22)",
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    rolePillText: { fontSize: 11, fontWeight: "700", color: "#fff" },
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
    draftPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 9,
      backgroundColor: "rgba(255,255,255,0.9)",
    },
    draftPillText: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.3,
      color: c.primary,
      textTransform: "uppercase",
    },
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
