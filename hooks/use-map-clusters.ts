import { CLUSTER_DEBOUNCE_MS, CLUSTER_ZOOM_THRESHOLD, MAP_DELTAS } from "@/constants/config";
import { getMapSummary } from "@/services/incidents";
import type { MapClusterDto } from "@/types/incidents";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Region } from "react-native-maps";

function regionToZoom(latitudeDelta: number): number {
  return Math.round(Math.log(360 / latitudeDelta) / Math.LN2);
}

const INITIAL_REGION: Region = {
  latitude: 0,
  longitude: 0,
  latitudeDelta: MAP_DELTAS.explore,
  longitudeDelta: MAP_DELTAS.explore,
};

export function useMapClusters(filterStatus: string | null, filterType: string | null) {
  const [clusters, setClusters] = useState<MapClusterDto[]>([]);
  const [currentZoom, setCurrentZoom] = useState(() => regionToZoom(MAP_DELTAS.explore));
  const currentRegionRef = useRef<Region>(INITIAL_REGION);
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
    } catch {
      // silencieux — ne pas bloquer la carte
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

  return { clusters, currentZoom, currentRegionRef, onRegionChangeComplete, reload };
}
