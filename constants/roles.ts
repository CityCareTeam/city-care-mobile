import { languageAwareLabels } from "@/constants/i18n";
import { CityCareColors } from "@/constants/theme";

// Relu à chaque accès plutôt que figé à l'import : voir `constants/incidents.ts`.
export const ROLE_LABELS = languageAwareLabels((d) => d.roles);

export const ROLE_COLORS: Record<string, string> = {
  Admin: CityCareColors.statusRed,
  Agent: CityCareColors.primary,
  Citizen: CityCareColors.statusGreen,
};
