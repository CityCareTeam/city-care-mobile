import { DEFAULT_LOCATION, MAP_DELTAS } from "@/constants/config";
import * as Location from "expo-location";
import { useEffect, useState } from "react";

export function useUserLocation(delta: number = MAP_DELTAS.user) {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>(DEFAULT_LOCATION);
  const [loading, setLoading] = useState(true);
  /**
   * Vrai seulement si l'appareil a réellement rendu une position.
   *
   * `coords` vaut Lyon par défaut, et ce repli est utile pour cadrer une carte —
   * mais il ne vaut rien pour calculer une distance : on annoncerait « à 4 km »
   * en mesurant depuis un centre-ville où l'utilisateur n'est pas. Qui a besoin
   * d'une position vraie doit pouvoir distinguer les deux.
   */
  const [precise, setPrecise] = useState(false);

  useEffect(() => {
    async function init() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        try {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setPrecise(true);
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
    precise,
    region: { ...coords, latitudeDelta: delta, longitudeDelta: delta },
  };
}
