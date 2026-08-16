import { DEFAULT_LOCATION } from "@/constants/config";
import { reverseGeocode } from "@/services/incidents";
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

export type HeaderWeather = Weather & {
  /** Nom de la commune, quand le back a su la nommer. */
  city: string | null;
};

/**
 * Nom de la commune pour ces coordonnées.
 *
 * Passe par le back plutôt que par un service tiers : il expose déjà
 * `/geocode/reverse`, le formulaire de signalement s'en sert, et une seconde
 * source donnerait deux orthographes pour la même ville. Un échec n'est pas une
 * erreur — on affiche alors la météo sans son nom.
 */
async function cityFor(latitude: number, longitude: number): Promise<string | null> {
  try {
    const place = await reverseGeocode(latitude, longitude);
    return place?.city?.trim() || null;
  } catch {
    return null;
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
export function useWeather(): HeaderWeather | null {
  const [weather, setWeather] = useState<HeaderWeather | null>(null);

  useEffect(() => {
    let alive = true;

    void (async () => {
      const cached = await readJson<HeaderWeather>(KEY);
      const age = cached ? Date.now() - new Date(cached.fetchedAt).getTime() : Infinity;

      if (cached && age < MAX_AGE_MS) {
        if (!alive) return;
        setWeather(cached);
        // Assez frais : on s'en tient là plutôt que d'appeler pour rien.
        if (age < FRESH_FOR_MS) return;
      }

      try {
        const { latitude, longitude } = await weatherLocation();
        // La ville en parallèle : elle ne doit pas retarder la température, qui
        // est ce qu'on est venu lire.
        const [current, city] = await Promise.all([
          getCurrentWeather(latitude, longitude),
          cityFor(latitude, longitude),
        ]);
        if (!alive) return;
        const fresh = { ...current, city };
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
