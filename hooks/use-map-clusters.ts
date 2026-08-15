import { CLUSTER_DEBOUNCE_MS, CLUSTER_ZOOM_THRESHOLD, DEFAULT_LOCATION, MAP_DELTAS } from "@/constants/config";
import { getMapSummary } from "@/services/incidents";
import type { MapClusterDto } from "@/types/incidents";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Region } from "react-native-maps";

function regionToZoom(latitudeDelta: number): number {
  return Math.round(Math.log(360 / latitudeDelta) / Math.LN2);
}

// Doit refléter la région réellement affichée au montage de la carte, sinon le
// premier chargement interroge une bbox vide (lat/lng 0,0) et aucun cluster
// n'apparaît tant que l'utilisateur n'a pas bougé la carte.
const FALLBACK_REGION: Region = {
  ...DEFAULT_LOCATION,
  latitudeDelta: MAP_DELTAS.user,
  longitudeDelta: MAP_DELTAS.user,
};

export function useMapClusters(
  filterStatus: string | null,
  filterType: string | null,
  initialRegion: Region = FALLBACK_REGION,
) {
  const [clusters, setClusters] = useState<MapClusterDto[]>([]);
  const [failed, setFailed] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(() => regionToZoom(initialRegion.latitudeDelta));
  const currentRegionRef = useRef<Region>(initialRegion);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadClusters = useCallback(async (region: Region) => {
    const zoom = regionToZoom(region.latitudeDelta);
    if (zoom >= CLUSTER_ZOOM_THRESHOLD) { setClusters([]); return; }

    const latMin = region.latitude - region.latitudeDelta / 2;
    const latMax = region.latitude + region.latitudeDelta / 2;
    const lngMin = region.longitude - region.longitudeDelta / 2;
    const lngMax = region.longitude + region.longitudeDelta / 2;

    try {
      const res = await getMapSummary({
        zoom, latMin, latMax, lngMin, lngMax,
        status: filterStatus ?? undefined,
        type: filterType ?? undefined,
      });
      setClusters(res.data);
      setFailed(false);
    } catch {
      // La carte n'est pas bloquée, mais l'échec est signalé : sans ça, une
      // panne réseau donnait exactement le même écran qu'une zone sans
      // signalement.
      setFailed(true);
    }
  }, [filterStatus, filterType]);

  const onRegionChangeComplete = useCallback((region: Region) => {
    currentRegionRef.current = region;
    setCurrentZoom(regionToZoom(region.latitudeDelta));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void loadClusters(region), CLUSTER_DEBOUNCE_MS);
  }, [loadClusters]);

  // Recharge les clusters quand les filtres changent
  useEffect(() => {
    void loadClusters(currentRegionRef.current);
  }, [loadClusters]);

  const reload = useCallback(() => void loadClusters(currentRegionRef.current), [loadClusters]);

  return { clusters, failed, currentZoom, currentRegionRef, onRegionChangeComplete, reload };
}
