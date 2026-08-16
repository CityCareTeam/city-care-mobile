import { readJson, writeJson } from "@/storage/local-store";
import type { DraftPhoto } from "@/storage/report-draft";
import type { IncidentType } from "@/types/incidents";

const QUEUE_KEY = "pending_reports";
const REJECTED_KEY = "rejected_reports";

/**
 * Au-delà, on cesse de réessayer. Le compteur ne monte que sur un échec
 * réseau ; s'il atteint ce seuil, c'est que quelque chose ne passera jamais, et
 * réessayer à chaque retour de réseau reviendrait à empoisonner tous les envois
 * suivants avec le même échec.
 */
const MAX_ATTEMPTS = 5;

export type PendingReport = {
  id: string;
  latitude: number;
  longitude: number;
  type: IncidentType;
  description: string;
  photos: DraftPhoto[];
  queuedAt: string;
  attempts: number;
};

/** Un signalement que le serveur a refusé : il ne repartira pas tout seul. */
export type RejectedReport = {
  id: string;
  description: string;
  reason: string;
  rejectedAt: string;
};

/**
 * File des signalements créés sans réseau.
 *
 * Un signalement rédigé sur le terrain et perdu faute de réseau, c'est la
 * situation où l'utilisateur cesse de se servir de l'application. On l'accepte
 * donc localement, on le dit, et on le rejoue au retour du réseau.
 *
 * Deux issues, et une seule fait boucler :
 *
 *   - la requête n'a jamais atteint le serveur — on garde, on réessaiera ;
 *   - le serveur a répondu et refusé — inutile d'insister : le signalement
 *     sort de la file et passe dans les refusés, pour que l'utilisateur
 *     l'apprenne au lieu de croire son envoi parti.
 */
export async function listPendingReports(): Promise<PendingReport[]> {
  const queue = await readJson<PendingReport[]>(QUEUE_KEY);
  return Array.isArray(queue) ? queue : [];
}

export async function enqueueReport(
  report: Omit<PendingReport, "id" | "queuedAt" | "attempts">,
): Promise<PendingReport> {
  const queued: PendingReport = {
    ...report,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    queuedAt: new Date().toISOString(),
    attempts: 0,
  };
  const queue = await listPendingReports();
  await writeJson(QUEUE_KEY, [...queue, queued]);
  return queued;
}

/** Envoi réussi : le signalement quitte la file. */
export async function removePendingReport(id: string): Promise<void> {
  const queue = await listPendingReports();
  await writeJson(
    QUEUE_KEY,
    queue.filter((report) => report.id !== id),
  );
}

/**
 * Échec réseau : on garde, mais on compte. Renvoie `true` si le signalement est
 * encore dans la file, `false` s'il vient d'être versé aux refusés faute d'avoir
 * jamais pu partir.
 */
export async function recordFailedAttempt(id: string): Promise<boolean> {
  const queue = await listPendingReports();
  const report = queue.find((item) => item.id === id);
  if (!report) return false;

  const attempts = report.attempts + 1;
  if (attempts >= MAX_ATTEMPTS) {
    await rejectReport(id, "Envoi impossible après plusieurs tentatives.");
    return false;
  }

  await writeJson(
    QUEUE_KEY,
    queue.map((item) => (item.id === id ? { ...item, attempts } : item)),
  );
  return true;
}

/** Refus du serveur : hors de la file, et gardé de côté pour le dire. */
export async function rejectReport(id: string, reason: string): Promise<void> {
  const queue = await listPendingReports();
  const report = queue.find((item) => item.id === id);
  if (!report) return;

  const rejected = await listRejectedReports();
  await writeJson(REJECTED_KEY, [
    ...rejected,
    {
      id: report.id,
      description: report.description,
      reason,
      rejectedAt: new Date().toISOString(),
    },
  ]);
  await writeJson(
    QUEUE_KEY,
    queue.filter((item) => item.id !== id),
  );
}

export async function listRejectedReports(): Promise<RejectedReport[]> {
  const rejected = await readJson<RejectedReport[]>(REJECTED_KEY);
  return Array.isArray(rejected) ? rejected : [];
}

/** Une fois l'utilisateur prévenu, on n'y revient plus. */
export async function clearRejectedReports(): Promise<void> {
  await writeJson(REJECTED_KEY, []);
}
