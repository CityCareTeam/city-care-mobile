export const MAX_INCIDENT_PHOTOS = 3;

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
