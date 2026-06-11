import { DEFAULT_LOCATION, MAP_DELTAS } from "@/constants/config";
import * as Location from "expo-location";
import { useEffect, useState } from "react";

export function useUserLocation(delta = MAP_DELTAS.user) {
  const [coords, setCoords] = useState(DEFAULT_LOCATION);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        try {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        } catch {
          // garde Lyon par défaut
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  return {
    coords,
    setCoords,
    loading,
    region: { ...coords, latitudeDelta: delta, longitudeDelta: delta },
  };
}
