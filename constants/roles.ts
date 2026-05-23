import { CityCareColors } from "@/constants/theme";

export const ROLE_LABELS: Record<string, string> = {
  Admin: "Administrateur",
  Agent: "Agent municipal",
  Citizen: "Citoyen",
};

export const ROLE_COLORS: Record<string, string> = {
  Admin: CityCareColors.statusRed,
  Agent: CityCareColors.primary,
  Citizen: CityCareColors.statusGreen,
};
