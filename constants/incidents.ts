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
  reported: "#2196f3",
  in_progress: "#f0a500",
  resolved: "#4caf50",
};

export const STATUS_LABEL: Record<string, string> = {
  reported: "Déclaré",
  in_progress: "En cours",
  resolved: "Résolu",
};

export const TYPE_LABEL: Record<string, string> = {
  Road: "Voirie",
  Lighting: "Éclairage",
  Waste: "Déchets",
  Graffiti: "Graffiti",
  Safety: "Sécurité",
  Other: "Autre",
};

// snake_case — valeurs attendues par le back (notification-settings)
export const TYPE_LABEL_SNAKE: Record<string, string> = {
  road: "Voirie",
  lighting: "Éclairage",
  waste: "Déchets",
  graffiti: "Graffiti",
  safety: "Sécurité",
  other: "Autre",
};

/** Transitions de statut valides côté client (le back re-valide). */
export const NEXT_STATUSES: Record<string, string[]> = {
  reported: ["in_progress"],
  in_progress: ["resolved"],
  resolved: [],
};
