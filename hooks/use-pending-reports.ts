import { isNetworkError } from "@/services/api-client";
import { createIncident, uploadPhoto } from "@/services/incidents";
import {
  clearRejectedReports,
  listPendingReports,
  listRejectedReports,
  recordFailedAttempt,
  rejectReport,
  removePendingReport,
  type PendingReport,
  type RejectedReport,
} from "@/storage/pending-reports";
import { getValidToken } from "@/storage/tokens";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Rejeu des signalements mis en attente faute de réseau.
 *
 * `flush()` est appelé quand on vient d'avoir la preuve que le réseau répond —
 * en pratique après un chargement réussi du fil. Inutile d'écouter l'état de la
 * connexion : une requête qui aboutit est un signal plus fiable qu'un indicateur
 * système, qui dit « connecté » sur un portail captif comme sur une vraie
 * liaison.
 */
export function usePendingReports() {
  const [pending, setPending] = useState<PendingReport[]>([]);
  const [rejected, setRejected] = useState<RejectedReport[]>([]);
  const flushing = useRef(false);

  const refresh = useCallback(async () => {
    setPending(await listPendingReports());
    setRejected(await listRejectedReports());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /**
   * Vide la file, un signalement à la fois et dans l'ordre d'arrivée : deux
   * envois simultanés sur un réseau qui vient tout juste de revenir, c'est le
   * meilleur moyen de les rater tous les deux.
   */
  const flush = useCallback(async () => {
    // Le drapeau se pose avant la première attente, jamais après : deux rejeux
    // déclenchés dans le même tour de boucle liraient tous deux une file encore
    // pleine, et créeraient deux fois le même signalement.
    if (flushing.current) return;
    flushing.current = true;
    try {
      const queue = await listPendingReports();
      for (const report of queue) {
        const token = await getValidToken();
        // Sans session valide, ce n'est plus une affaire de réseau : on garde
        // la file intacte et on attend une reconnexion de l'utilisateur.
        if (!token) break;

        try {
          const incident = await createIncident(
            {
              latitude: report.latitude,
              longitude: report.longitude,
              type: report.type,
              description: report.description,
            },
            token,
          );

          // Les photos ne retiennent pas le signalement : il est enregistré, et
          // une image perdue du cache de l'appareil ne doit pas le faire
          // remettre en file pour être créé une seconde fois.
          for (const photo of report.photos) {
            try {
              await uploadPhoto(incident.id, photo.uri, photo.fileName, photo.mimeType, token);
            } catch {
              // Tant pis pour la photo.
            }
          }

          await removePendingReport(report.id);
        } catch (error) {
          if (isNetworkError(error)) {
            // Le réseau est reparti : inutile d'essayer les suivants.
            await recordFailedAttempt(report.id);
            break;
          }
          await rejectReport(
            report.id,
            error instanceof Error ? error.message : "Refusé par le serveur.",
          );
        }
      }
    } finally {
      flushing.current = false;
      await refresh();
    }
  }, [refresh]);

  /** L'utilisateur a lu l'échec : on ne le lui répète pas à chaque écran. */
  const dismissRejected = useCallback(async () => {
    await clearRejectedReports();
    setRejected([]);
  }, []);

  return { pending, rejected, flush, dismissRejected, refresh };
}
