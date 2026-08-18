import { STATUS_COLOR, STATUS_LABEL } from "@/constants/incidents";
import type { PillOption } from "@/components/ui/GlassPillSelector";

/**
 * Construites au rendu et non au chargement du module : le libellé « Tous » suit
 * la langue, et une constante de module l'aurait figé à l'import — donc au
 * français, quoi que choisisse l'utilisateur ensuite.
 */
export function statusOptions(all: string, withResolved: boolean): PillOption<string | null>[] {
  const options: PillOption<string | null>[] = [
    { label: all,                       value: null },
    { label: STATUS_LABEL.reported,     value: "reported",    dotColor: STATUS_COLOR.reported },
    { label: STATUS_LABEL.in_progress,  value: "in_progress", dotColor: STATUS_COLOR.in_progress },
  ];
  if (withResolved) {
    options.push({ label: STATUS_LABEL.resolved, value: "resolved", dotColor: STATUS_COLOR.resolved });
  }
  return options;
}

/**
 * Date du jour, dans la langue active.
 *
 * C'était une constante de module : calculée une fois au chargement, donc figée
 * en français — et accessoirement jamais mise à jour si l'application restait
 * ouverte au passage de minuit.
 */
