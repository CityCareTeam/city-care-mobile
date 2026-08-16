import { getStrings, type Dictionary } from "@/constants/i18n";
import { CityCareColors } from "@/constants/theme";

// Relu à chaque accès plutôt que figé à l'import : voir `constants/incidents.ts`.
export const ROLE_LABELS: Record<string, string> = new Proxy(
  {},
  { get: (_target, key: string) => getStrings().roles[key as keyof Dictionary["roles"]] },
);

export const ROLE_COLORS: Record<string, string> = {
  Admin: CityCareColors.statusRed,
  Agent: CityCareColors.primary,
  Citizen: CityCareColors.statusGreen,
};
