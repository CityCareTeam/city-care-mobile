import { useHomeStyles } from "@/components/home/home-styles";
import { IncidentRow } from "@/components/incident-row";
import { Text } from "@/components/ui/AppText";
import { INCIDENTS_PAGE_SIZE } from "@/constants/config";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import { useState } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";

/**
 * `onLoadMore` prolonge la liste au-delà de ce que le serveur a déjà donné. Le
 * bouton conduit donc deux gestes derrière une seule apparence : dérouler ce
 * qu'on tient en mémoire, puis, une fois au bout, aller chercher la page
 * suivante. L'utilisateur n'a pas à connaître cette frontière — il veut voir
 * plus loin, c'est tout.
 */
export function IncidentList({
  incidents,
  onPress,
  pageSize = INCIDENTS_PAGE_SIZE.list,
  isMine = false,
  myIds,
  followedIds,
  onToggleFollow,
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
    /** Absente tant qu'on ne connaît pas la position de l'utilisateur. */
    distanceKm?: number;
    /** Masqué par la modération. N'arrive que sur ses propres signalements. */
    hidden?: boolean;
  }[];
  onPress: (id: string) => void;
  pageSize?: number;
  isMine?: boolean;
  myIds?: Set<string>;
  followedIds?: Set<string>;
  /** Passé, chaque signet devient un bouton : c'est la gestion des favoris. */
  onToggleFollow?: (id: string) => void;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}) {
  const { colors } = useAppColors();
  const styles = useHomeStyles();
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
          {/* `isMine` a deux sources parce que les listes ne savent pas la même
              chose : l'onglet « Les miens » l'affirme pour toute la liste, le fil
              de la ville le décide ligne par ligne. La propriété de la liste était
              déclarée mais jamais transmise — le badge manquait donc partout où
              elle était le seul indice. */}
          <IncidentRow
            id={inc.id}
            type={inc.type}
            status={inc.status}
            description={inc.description}
            address={inc.address}
            createdAt={inc.createdAt}
            onPress={onPress}
            isMine={isMine || myIds?.has(inc.id)}
            isFollowed={followedIds?.has(inc.id)}
            onToggleFollow={onToggleFollow}
            distanceKm={inc.distanceKm}
            hidden={inc.hidden}
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
