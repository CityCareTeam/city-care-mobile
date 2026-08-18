import { languageAwareLabels } from "@/constants/i18n";
import { ROLE_COLOR } from "@/constants/theme";

// Relu à chaque accès plutôt que figé à l'import : voir `constants/incidents.ts`.
export const ROLE_LABELS = languageAwareLabels((d) => d.roles);

/**
 * Les mêmes couleurs, indexées par le libellé capitalisé.
 *
 * Le serveur renvoie les rôles en minuscules, les vues héritées les lisent en
 * capitales : deux clés pour une seule table de couleurs. Elles étaient jusqu'ici
 * deux tables aux teintes différentes — un agent orange sur le profil, bleu dans
 * la gestion des comptes.
 */
export const ROLE_COLORS: Record<string, string> = {
  Admin: ROLE_COLOR.admin,
  Agent: ROLE_COLOR.agent,
  Citizen: ROLE_COLOR.citizen,
};
