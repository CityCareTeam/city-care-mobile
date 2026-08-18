import type { IncidentResponse } from "@/types/incidents";
import type { MyIncidentItem } from "@/types/users";
import type { Paging } from "@/hooks/use-incidents-paging";
import { EmptyState } from "@/components/home/EmptyState";
import { GlassPillSelector } from "@/components/ui/GlassPillSelector";
import { IncidentList } from "@/components/home/IncidentList";
import { IncidentSearchBar, NoSearchResults } from "@/components/incident-search-bar";
import { LoadMore } from "@/components/home/LoadMore";
import { PersonalStatsCard } from "@/components/personal-stats-card";
import { StatusBreakdown } from "@/components/status-breakdown";
import { TYPE_LABEL } from "@/constants/incidents";
import { Text } from "@/components/ui/AppText";
import { TouchableOpacity, View } from "react-native";
import { applyFilters, useIncidentFilters } from "@/hooks/use-incident-filters";
import { awayKm, countByStatus } from "@/utils/incident-stats";
import { statusOptions } from "@/components/home/status-options";
import { useCityStats } from "@/hooks/use-city-stats";
import { useFollowedAlerts } from "@/hooks/use-followed-alerts";
import { useFollowedIncidents } from "@/hooks/use-followed-incidents";
import { useHomeStyles } from "@/components/home/home-styles";
import { useIncidentSearch } from "@/hooks/use-incident-search";
import { useMemo, useState } from "react";
import { useStrings } from "@/hooks/use-strings";

export function CitizenView({
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
  const styles = useHomeStyles();
  const t = useStrings();

  const [activeTab, setActiveTab] = useState<"mine" | "all" | "followed">("mine");

  const isMineTab = activeTab === "mine";
  const isFollowedTab = activeTab === "followed";

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
  const { followed, toggle: toggleFollow } = useFollowedIncidents();

  // Les suivis se cherchent dans le fil déjà chargé : aucun endpoint ne permet
  // de demander une liste d'incidents par identifiants. Ceux qui manquent sont
  // annoncés plutôt que passés sous silence — la page suivante les ramènera.
  const followedIncidents = useMemo(
    () => allIncidents.filter((incident) => followed.has(incident.id)),
    [allIncidents, followed],
  );
  const missingFollowed = followed.size - followedIncidents.length;
  const followedSearch = useIncidentSearch(followedIncidents);
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
  const activeSearch = isFollowedTab ? followedSearch : isMineTab ? mineSearch : search;

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
          { label: t.home.tabFollowed,  value: "followed" as const, badge: followed.size || undefined },
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
        query={activeSearch.query}
        onQueryChange={activeSearch.setQuery}
        sort={activeSearch.sort}
        onSortChange={(next) => void activeSearch.setSort(next)}
      />

      {/* ── Contenu de l'onglet actif ── */}
      {isFollowedTab ? (
        followedSearch.results.length === 0 ? (
          <>
            {followedSearch.query.trim() ? (
              <NoSearchResults query={followedSearch.query} />
            ) : (
              <>
                <EmptyState text={followed.size === 0 ? t.home.noFollowed : t.emptyState.noFilterResults} />
                {followed.size === 0 && <Text style={styles.followedHint}>{t.home.followedHint}</Text>}
              </>
            )}
            {missingFollowed > 0 && (
              <>
                <Text style={styles.followedHint}>{t.home.followedMissing(missingFollowed)}</Text>
                <LoadMore paging={paging} />
              </>
            )}
          </>
        ) : (
          <>
            <IncidentList
              followedIds={followed}
              myIds={myIdsSet}
              onToggleFollow={(id) => void toggleFollow(id)}
              incidents={followedSearch.results.map((i) => ({
                id: i.id, type: i.type, status: i.status, description: i.description,
                address: i.addressLabel, createdAt: i.createdAt,
                distanceKm: awayKm(followedSearch.origin, i),
              }))}
              onPress={onPress}
            />
            {/* Un suivi peut vivre plus bas dans le fil : on le dit, plutôt que
                de laisser croire qu'il a disparu. */}
            {missingFollowed > 0 && (
              <>
                <Text style={styles.followedHint}>{t.home.followedMissing(missingFollowed)}</Text>
                <LoadMore paging={paging} />
              </>
            )}
          </>
        )
      ) : isMineTab ? (
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
                // Les coordonnées viennent du fil : la charge utile de « mes
                // signalements » ne les porte pas.
                distanceKm: awayKm(mineSearch.origin, full),
                // Le serveur ne renvoie cet état qu'à l'auteur, et « mes
                // signalements » est donc la seule liste où il puisse apparaître.
                hidden: i.visibility !== undefined && i.visibility !== "visible",
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
            incidents={search.results.map((i) => ({ id: i.id, type: i.type, status: i.status, description: i.description, address: i.addressLabel, createdAt: i.createdAt, distanceKm: awayKm(search.origin, i) }))}
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
