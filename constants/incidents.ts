import { languageAwareLabels } from "@/constants/i18n";
import { INFO, SUCCESS, WARNING } from "@/constants/theme";
import type MaterialIcons from "@expo/vector-icons/MaterialIcons";

export const MAX_INCIDENT_PHOTOS = 3;

export const TYPE_ICON: Record<string, React.ComponentProps<typeof MaterialIcons>["name"]> = {
  Road:     "construction",
  Lighting: "lightbulb",
  Waste:    "delete-outline",
  Graffiti: "format-paint",
  Safety:   "shield",
  Other:    "help-outline",
};

export const TYPE_COLOR: Record<string, string> = {
  Road:     "#FF7043",
  Lighting: "#FFC107",
  Waste:    "#66BB6A",
  Graffiti: "#AB47BC",
  Safety:   "#EF5350",
  Other:    "#78909C",
};

export const STATUS_COLOR: Record<string, string> = {
  reported: INFO,
  in_progress: WARNING,
  resolved: SUCCESS,
};

/**
 * Paliers de densité d'une pastille de regroupement, du plus dense au moins
 * dense — l'ordre compte, le premier seuil atteint gagne. Les teintes sont
 * volontairement hors de la palette des statuts pour rester lisibles comme un
 * signal de volume et non de statut.
 */
export const CLUSTER_DENSITY = [
  { min: 100, color: "#c62828", label: "100+" },
  { min: 20, color: "#ef5350", label: "20+" },
] as const;

/**
 * Couleurs des marqueurs de carte. Identiques aux couleurs de statut, sauf le
 * résolu : au même poids visuel que le reste, il attirait l'œil sur ce qui est
 * déjà réglé. Une teinte désaturée le fait reculer sans le faire disparaître.
 * `STATUS_COLOR` reste la référence partout ailleurs — légende, fiche détail,
 * frise de progression — où c'est le statut lui-même qu'on désigne.
 */
export const MAP_STATUS_COLOR: Record<string, string> = {
  ...STATUS_COLOR,
  resolved: "#86c08c",
};

// Les libellés vivent dans `constants/i18n/` et sont relus à chaque accès :
// figés à l'import, ils seraient restés en français quelle que soit la langue
// choisie ensuite. Le relais garde l'interface d'un objet — énumération
// comprise, sans quoi les listes construites par `Object.keys` seraient vides.
export const STATUS_LABEL = languageAwareLabels((d) => d.status);

export const TYPE_LABEL = languageAwareLabels((d) => d.incidentTypes);

// snake_case — valeurs attendues par le back (notification-settings)
export const TYPE_LABEL_SNAKE = languageAwareLabels((d) =>
  Object.fromEntries(Object.entries(d.incidentTypes).map(([key, label]) => [key.toLowerCase(), label])),
);

/** Transitions de statut valides côté client (le back re-valide). */
export const NEXT_STATUSES: Record<string, string[]> = {
  reported: ["in_progress"],
  in_progress: ["resolved"],
  resolved: [],
};
