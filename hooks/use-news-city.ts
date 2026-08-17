import { cityById, type NewsCity } from "@/constants/news-cities";
import { readJson, writeJson } from "@/storage/local-store";
import { nearestCity } from "@/utils/news-city";
import { usePreferences } from "@/context/PreferencesContext";
import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";

const KEY = "news_city";

/**
 * Comment la ville affichée a été décidée.
 *
 * L'écran en a besoin, pas par curiosité : sans ville à montrer, il doit dire
 * *pourquoi* — une position refusée et une position hors des villes couvertes
 * appellent deux phrases différentes, et un utilisateur qui a choisi sa ville
 * ne doit pas se la voir reprendre au prochain déplacement.
 */
export type CityOrigin = "pending" | "chosen" | "located" | "uncovered" | "unavailable";

/**
 * Ville de l'écran actualités.
 *
 * Par défaut la plus proche, d'où le passage par la position. Un choix
 * explicite, lui, est gardé et prime : la géolocalisation propose au premier
 * lancement, elle ne décide pas à chaque ouverture.
 */
export function useNewsCity() {
  const [city, setCity] = useState<NewsCity | null>(null);
  const [origin, setOrigin] = useState<CityOrigin>("pending");
  const { location: allowed } = usePreferences();

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      const stored = cityById(await readJson<string>(KEY));
      if (cancelled) return;
      if (stored) {
        setCity(stored);
        setOrigin("chosen");
        return;
      }

      // Coupée dans les réglages : on n'a plus qu'à le dire, et la liste de
      // villes reste à un appui.
      if (!allowed) {
        setOrigin("unavailable");
        return;
      }

      try {
        // Idempotent quand la carte a déjà obtenu l'autorisation ; sinon la
        // demande se justifie d'elle-même, puisqu'elle sert à choisir la ville.
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") throw new Error("refusée");

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Lowest,
        });
        if (cancelled) return;

        const near = nearestCity(position.coords);
        setCity(near);
        setOrigin(near ? "located" : "uncovered");
      } catch {
        if (!cancelled) setOrigin("unavailable");
      }
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  const choose = useCallback((next: NewsCity) => {
    setCity(next);
    setOrigin("chosen");
    void writeJson(KEY, next.id);
  }, []);

  return { city, origin, choose };
}
