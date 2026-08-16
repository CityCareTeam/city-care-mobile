import { fetchWithTimeout } from "@/services/api-client";
import { conditionFromCode, type WeatherCondition } from "@/utils/weather-code";

const ENDPOINT = "https://api.open-meteo.com/v1/forecast";

export type Weather = {
  condition: WeatherCondition;
  temperature: number;
  isDay: boolean;
  fetchedAt: string;
};

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    is_day?: number;
  };
};

/**
 * Météo courante, par Open-Meteo.
 *
 * Choisi pour ce qu'il ne demande pas : **aucune clé d'API**. Les autres
 * fournisseurs imposent un jeton, donc un secret EAS de plus à rattacher aux
 * environnements — et on a vu ce que la clé Google Maps a coûté à la chaîne de
 * mise à jour. Ici il n'y a rien à stocker, rien à faire fuir, et la
 * fonctionnalité part par OTA comme le reste.
 *
 * Le service n'appartient pas au back CityCare : il ne passe donc ni par
 * `authFetch` ni par `API_ENDPOINTS`, mais garde le même délai de garde que le
 * reste de l'application.
 */
export async function getCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<Weather> {
  const url =
    `${ENDPOINT}?latitude=${latitude.toFixed(3)}&longitude=${longitude.toFixed(3)}` +
    `&current=temperature_2m,weather_code,is_day`;

  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`Météo indisponible (${response.status})`);

  const data = (await response.json()) as OpenMeteoResponse;
  const temperature = data.current?.temperature_2m;
  const code = data.current?.weather_code;

  // Une réponse sans température n'est pas une météo : mieux vaut ne rien
  // afficher qu'un « 0° » inventé à partir d'un champ absent.
  if (typeof temperature !== "number" || typeof code !== "number") {
    throw new Error("Réponse météo incomplète");
  }

  return {
    condition: conditionFromCode(code),
    temperature,
    isDay: data.current?.is_day !== 0,
    fetchedAt: new Date().toISOString(),
  };
}
