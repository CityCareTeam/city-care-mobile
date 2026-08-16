import { NEWS_CITIES, NEWS_CITY_RADIUS_KM, type NewsCity } from "@/constants/news-cities";
import { distanceKm } from "@/utils/incident-search";

/**
 * La ville couverte la plus proche d'une position, ou rien si la plus proche
 * est déjà trop loin.
 *
 * Rendre `null` plutôt que la moins mauvaise des villes est le point de cette
 * fonction : c'est ce qui permet à l'écran de dire « aucune ville près de
 * vous » au lieu d'ouvrir sur des événements qui ne concernent personne.
 */
export function nearestCity(
  coords: { latitude: number; longitude: number },
  cities: readonly NewsCity[] = NEWS_CITIES,
  radiusKm: number = NEWS_CITY_RADIUS_KM,
): NewsCity | null {
  let closest: NewsCity | null = null;
  let shortest = Infinity;

  for (const city of cities) {
    const km = distanceKm(coords, { latitude: city.latitude, longitude: city.longitude });
    if (km < shortest) {
      shortest = km;
      closest = city;
    }
  }

  return shortest <= radiusKm ? closest : null;
}
