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

/** Transitions de statut valides côté client (le back re-valide). */
export const NEXT_STATUSES: Record<string, string[]> = {
  reported: ["in_progress", "resolved"],
  in_progress: ["resolved"],
  resolved: [],
};
