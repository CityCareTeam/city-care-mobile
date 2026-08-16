import type MaterialIcons from "@expo/vector-icons/MaterialIcons";

/**
 * Conditions retenues — huit, pas quarante.
 *
 * Open-Meteo suit la codification WMO, qui distingue par exemple la bruine
 * légère de la bruine modérée et de la bruine verglaçante. Sur une ligne
 * d'en-tête haute de seize pixels, ces nuances n'ont nulle part où aller : on
 * regroupe ce qui se dessine de la même façon et se raconte de la même façon.
 */
export type WeatherCondition =
  | "clear"
  | "partlyCloudy"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunderstorm";

/** Table WMO → condition. https://open-meteo.com/en/docs (Weather variable documentation) */
const BY_CODE = new Map<number, WeatherCondition>([
  [0, "clear"],
  [1, "clear"],
  [2, "partlyCloudy"],
  [3, "cloudy"],
  [45, "fog"], [48, "fog"],
  [51, "drizzle"], [53, "drizzle"], [55, "drizzle"], [56, "drizzle"], [57, "drizzle"],
  [61, "rain"], [63, "rain"], [65, "rain"], [66, "rain"], [67, "rain"],
  [80, "rain"], [81, "rain"], [82, "rain"],
  [71, "snow"], [73, "snow"], [75, "snow"], [77, "snow"], [85, "snow"], [86, "snow"],
  [95, "thunderstorm"], [96, "thunderstorm"], [99, "thunderstorm"],
]);

/**
 * Un code inconnu retombe sur « couvert » plutôt que sur du soleil : se tromper
 * vers le gris se remarque moins que promettre un beau temps qu'il ne fait pas.
 */
export function conditionFromCode(code: number): WeatherCondition {
  return BY_CODE.get(code) ?? "cloudy";
}

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

const DAY_ICONS: Record<WeatherCondition, IconName> = {
  clear: "wb-sunny",
  partlyCloudy: "wb-cloudy",
  cloudy: "cloud",
  fog: "foggy",
  drizzle: "grain",
  rain: "umbrella",
  snow: "ac-unit",
  thunderstorm: "thunderstorm",
};

export function weatherIcon(condition: WeatherCondition, isDay: boolean): IconName {
  // La nuit ne change que le ciel dégagé : un nuage reste un nuage, mais un
  // soleil à vingt-trois heures est une erreur que tout le monde voit.
  if (!isDay && condition === "clear") return "nights-stay";
  return DAY_ICONS[condition];
}

/** `18.4` → `18°`. Le dixième de degré n'aide personne à choisir un manteau. */
export function formatTemperature(celsius: number): string {
  return `${Math.round(celsius)}°`;
}
