import * as Location from "expo-location";
import { useEffect, useState } from "react";

const LYON = { latitude: 45.748, longitude: 4.847 };

export function useUserLocation(delta = 0.05) {
  const [coords, setCoords] = useState(LYON);
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
