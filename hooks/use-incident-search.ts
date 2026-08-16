import { DEFAULT_LOCATION } from "@/constants/config";
import { matchesQuery, sortIncidents, type SortMode } from "@/utils/incident-search";
import * as Location from "expo-location";
import { useCallback, useMemo, useState } from "react";

type Searchable = {
  description?: string | null;
  addressLabel?: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
};

/**
 * Recherche et tri du fil.
 *
 * Les deux vivent ensemble parce qu'ils s'appliquent l'un après l'autre sur la
 * même liste, et qu'un écran qui les tiendrait séparément recalculerait deux
 * fois. Le filtrage par statut et par type reste dans `use-incident-filters` :
 * il porte sur des champs fermés, celui-ci sur du texte libre.
 *
 * Le tri par proximité demande la position — et c'est le seul moment de
 * l'application où la réclamer se justifie sur cet écran : l'utilisateur vient
 * précisément de demander « ce qui est près de moi ». Tant qu'il ne l'a pas
 * choisi, on ne demande rien.
 */
export function useIncidentSearch<T extends Searchable>(incidents: T[]) {
  const [query, setQuery] = useState("");
  const [sort, setSortMode] = useState<SortMode>("recent");
  const [origin, setOrigin] = useState<{ latitude: number; longitude: number } | null>(null);

  const setSort = useCallback(async (next: SortMode) => {
    setSortMode(next);
    if (next !== "nearest" || origin) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        // Refus : le tri retombe sur la ville plutôt que de ne rien faire. Un
        // ordre « au plus proche du centre-ville » vaut mieux qu'un tri mort.
        setOrigin(DEFAULT_LOCATION);
        return;
      }
      const position =
        (await Location.getLastKnownPositionAsync()) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      setOrigin({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch {
      setOrigin(DEFAULT_LOCATION);
    }
  }, [origin]);

  const results = useMemo(() => {
    const found = query.trim() ? incidents.filter((incident) => matchesQuery(incident, query)) : incidents;
    return sortIncidents(found, sort, origin);
  }, [incidents, query, sort, origin]);

  return { query, setQuery, sort, setSort, results };
}
