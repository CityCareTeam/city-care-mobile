import { Toast } from "@/components/ui/ToastMessage";
import { STATUS_LABEL } from "@/constants/incidents";
import { useStrings } from "@/hooks/use-strings";
import { loadKnownStatuses, saveKnownStatuses } from "@/storage/followed-status";
import { detectFollowedChanges } from "@/utils/followed-changes";
import { useEffect, useRef } from "react";

type Trackable = { id: string; status: string };

/**
 * Prévient quand un signalement suivi change d'état.
 *
 * Le signet ne servait qu'à filtrer : personne ne suit un signalement pour aller
 * vérifier son statut à la main tous les matins. L'application relit déjà le fil
 * toutes les quinze secondes — comparer d'un relevé à l'autre suffit, sans
 * notification poussée ni modification du serveur.
 *
 * L'annonce est un toast et non une notification système : elle ne vaut que
 * pendant qu'on regarde l'écran, et prétendre le contraire demanderait le
 * concours du serveur.
 */
export function useFollowedAlerts(incidents: Trackable[], followed: Set<string>) {
  const t = useStrings();
  // Un relevé à la fois : deux passes concurrentes liraient la même mémoire et
  // annonceraient deux fois le même changement.
  const busy = useRef(false);

  useEffect(() => {
    if (incidents.length === 0 || followed.size === 0 || busy.current) return;

    busy.current = true;
    void (async () => {
      try {
        const known = await loadKnownStatuses();
        const { changes, statuses } = detectFollowedChanges(incidents, followed, known);
        await saveKnownStatuses(statuses);

        if (changes.length === 0) return;

        Toast.show({
          type: "success",
          text1: t.incident.followedChanged(changes.length),
          text2:
            changes.length === 1
              ? t.incident.followedChangedOne(STATUS_LABEL[changes[0].to] ?? changes[0].to)
              : undefined,
        });
      } finally {
        busy.current = false;
      }
    })();
  }, [incidents, followed, t]);
}
