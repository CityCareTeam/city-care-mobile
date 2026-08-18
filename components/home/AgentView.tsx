import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { IncidentResponse } from "@/types/incidents";
import type { Paging } from "@/hooks/use-incidents-paging";
import { EmptyState } from "@/components/home/EmptyState";
import { GlassPillSelector } from "@/components/ui/GlassPillSelector";
import { IncidentList } from "@/components/home/IncidentList";
import { IncidentSearchBar, NoSearchResults } from "@/components/incident-search-bar";
import { LoadMore } from "@/components/home/LoadMore";
import { SectionHeader } from "@/components/home/SectionHeader";
import { StatusBreakdown } from "@/components/status-breakdown";
import { TYPE_LABEL } from "@/constants/incidents";
import { Text } from "@/components/ui/AppText";
import { TouchableOpacity, View } from "react-native";
import { awayKm, countByStatus } from "@/utils/incident-stats";
import { statusOptions } from "@/components/home/status-options";
import { useCityStats } from "@/hooks/use-city-stats";
import { useHomeStyles } from "@/components/home/home-styles";
import { useIncidentFilters } from "@/hooks/use-incident-filters";
import { useIncidentSearch } from "@/hooks/use-incident-search";
import { useMemo } from "react";
import { useStrings } from "@/hooks/use-strings";

export function AgentView({
  incidents,
  onPress,
  paging,
}: {
  incidents: IncidentResponse[];
  onPress: (id: string) => void;
  paging: Paging;
}) {
  const styles = useHomeStyles();
  const t = useStrings();
  // Sans mémoïsation, ce tableau était recréé à chaque rendu — et comme
  // `typeCount` en dépend, son `useMemo` ne servait à rien : il recalculait à
  // tous les coups.
  const toHandle = useMemo(
    () => incidents.filter((i) => i.status === "reported" || i.status === "in_progress"),
    [incidents],
  );
  // Deux décomptes, et c'est voulu : celui de la ville pour le bilan, celui de
  // la pile pour la liste en dessous.
  const cityStats = useCityStats();
  const loaded = useMemo(() => countByStatus(incidents), [incidents]);
  const backlog = cityStats
    ? cityStats.reported + cityStats.inProgress
    : loaded.reported + loaded.inProgress;

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
      {/* Les deux compteurs portaient sur les pages chargées : ils annonçaient
          la pagination, pas la ville. Le bilan du citoyen dit la même chose en
          exact, et l'agent a en plus besoin du seul chiffre qui le concerne —
          ce qui reste à traiter. */}
      <StatusBreakdown
        title={t.stats.cityTitle}
        icon="location-city"
        total={cityStats?.total ?? incidents.length}
        resolved={cityStats?.resolved ?? loaded.resolved}
        inProgress={cityStats?.inProgress ?? loaded.inProgress}
        reported={cityStats?.reported ?? loaded.reported}
      >
        <View style={styles.backlogRow}>
          <MaterialIcons name="pending-actions" size={15} color="#2196f3" />
          <Text style={styles.backlogText}>{t.stats.backlog(backlog)}</Text>
        </View>
      </StatusBreakdown>

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
            distanceKm: awayKm(search.origin, i),
            // Renvoyé par le serveur seulement aux agents et aux admins.
            hidden: i.visibility !== undefined && i.visibility !== "visible",
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
