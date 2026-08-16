import { DEFAULT_LOCATION } from "@/constants/config";
import { getCurrentWeather, type Weather } from "@/services/weather";
import { readJson, writeJson } from "@/storage/local-store";
import * as Location from "expo-location";
import { useEffect, useState } from "react";

const KEY = "weather_cache";

/** La météo ne bouge pas assez vite pour justifier davantage. */
const FRESH_FOR_MS = 30 * 60 * 1000;

/** Au-delà, une météo gardée devient un mensonge. */
const MAX_AGE_MS = 3 * 60 * 60 * 1000;

/**
 * Position à utiliser pour la météo, **sans jamais demander la permission**.
 *
 * `useUserLocation` la réclame, ce qui a du sens sur la carte ou le formulaire
 * de signalement : l'utilisateur vient d'y demander quelque chose qui en dépend.
 * Faire surgir la même fenêtre sur l'accueil pour afficher une température
 * serait disproportionné — on se contente donc de la permission déjà accordée,
 * et à défaut de la ville.
 */
async function weatherLocation(): Promise<{ latitude: number; longitude: number }> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") return DEFAULT_LOCATION;
    const position = await Location.getLastKnownPositionAsync();
    if (!position) return DEFAULT_LOCATION;
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    return DEFAULT_LOCATION;
  }
}

/**
 * Météo de l'en-tête.
 *
 * Elle rend `null` tant qu'elle n'a rien à dire, et l'écran n'affiche alors
 * rien : une ligne d'en-tête qui clignote entre un chargement, une erreur et une
 * température vaut moins que pas de météo du tout.
 *
 * Le dernier relevé est gardé sur l'appareil — comme le fil, comme le brouillon.
 * Il s'affiche pendant que le réseau répond, et à sa place s'il ne répond pas.
 */
export function useWeather(): Weather | null {
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    let alive = true;

    void (async () => {
      const cached = await readJson<Weather>(KEY);
      const age = cached ? Date.now() - new Date(cached.fetchedAt).getTime() : Infinity;

      if (cached && age < MAX_AGE_MS) {
        if (!alive) return;
        setWeather(cached);
        // Assez frais : on s'en tient là plutôt que d'appeler pour rien.
        if (age < FRESH_FOR_MS) return;
      }

      try {
        const { latitude, longitude } = await weatherLocation();
        const fresh = await getCurrentWeather(latitude, longitude);
        if (!alive) return;
        setWeather(fresh);
        void writeJson(KEY, fresh);
      } catch {
        // Pas de météo, pas de message : ce n'est pas ce que l'utilisateur est
        // venu chercher sur cet écran.
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return weather;
}
