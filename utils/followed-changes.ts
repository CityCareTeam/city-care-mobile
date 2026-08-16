import type { KnownStatuses } from "@/storage/followed-status";

type Trackable = { id: string; status: string };

export type FollowedChange = {
  id: string;
  from: string;
  to: string;
};

/**
 * Ce qui a bougé parmi les signalements suivis.
 *
 * Trois règles, et chacune évite une notification qui aurait fait du bruit pour
 * rien :
 *
 *   - un signalement dont on ne connaissait pas encore le statut n'a pas
 *     « changé » : on l'enregistre, on se tait. Sans ça, suivre un signalement
 *     déclencherait aussitôt une alerte sur son propre geste ;
 *   - un signalement absent de la liste reçue n'est pas oublié pour autant : le
 *     fil est paginé, il peut simplement être plus bas. On garde ce qu'on
 *     savait de lui ;
 *   - un signalement qu'on ne suit plus sort de la mémoire, sinon la table
 *     grossirait indéfiniment.
 */
export function detectFollowedChanges(
  incidents: Trackable[],
  followed: Set<string>,
  known: KnownStatuses,
): { changes: FollowedChange[]; statuses: KnownStatuses } {
  const statuses: KnownStatuses = {};
  for (const id of followed) {
    if (known[id] !== undefined) statuses[id] = known[id];
  }

  const changes: FollowedChange[] = [];

  for (const incident of incidents) {
    if (!followed.has(incident.id)) continue;

    const previous = known[incident.id];
    if (previous !== undefined && previous !== incident.status) {
      changes.push({ id: incident.id, from: previous, to: incident.status });
    }
    statuses[incident.id] = incident.status;
  }

  return { changes, statuses };
}
