import { readJson, removeKey, writeJson } from "@/storage/local-store";
import type { IncidentType } from "@/types/incidents";

const KEY = "report_draft";

/**
 * Un brouillon plus vieux que ça ne se restaure plus. Retrouver dix jours plus
 * tard un formulaire à moitié rempli devant un nid-de-poule sans doute déjà
 * rebouché n'aide personne — et les photos, elles, auront de toute façon
 * disparu du cache de l'appareil.
 */
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

export type DraftPhoto = {
  uri: string;
  fileName: string;
  mimeType: string;
};

export type ReportDraft = {
  latitude: number;
  longitude: number;
  addressQuery: string;
  description: string;
  type: IncidentType | null;
  photos: DraftPhoto[];
  savedAt: string;
};

/**
 * Brouillon du formulaire de signalement.
 *
 * Le cas qu'on cherche à couvrir est celui du terrain : quelqu'un est dehors,
 * la photo est prise, la description à moitié tapée, et un appel entrant ou le
 * système reprend la main sur l'application. Sans brouillon, tout est à
 * refaire — et c'est précisément le moment où l'on renonce à signaler.
 *
 * ⚠️ Les photos ne sont pas copiées, seules leurs URI le sont. Elles pointent
 * vers le cache d'`expo-image-picker`, que le système peut vider. Un brouillon
 * restauré peut donc avoir perdu ses images ; l'envoi le signalera comme
 * n'importe quel échec d'upload. Les recopier dans un dossier à nous
 * demanderait `expo-file-system`, une dépendance de plus pour un cas de bord.
 */
export async function saveDraft(
  draft: Omit<ReportDraft, "savedAt">,
): Promise<void> {
  await writeJson(KEY, { ...draft, savedAt: new Date().toISOString() });
}

/** Le brouillon retenu, ou `null` s'il n'y en a pas — ou s'il a trop vieilli. */
export async function loadDraft(): Promise<ReportDraft | null> {
  const draft = await readJson<ReportDraft>(KEY);
  if (!draft || typeof draft.savedAt !== "string") return null;

  const age = Date.now() - new Date(draft.savedAt).getTime();
  if (!Number.isFinite(age) || age > MAX_AGE_MS) {
    await clearDraft();
    return null;
  }
  return draft;
}

export async function clearDraft(): Promise<void> {
  await removeKey(KEY);
}

/**
 * Un formulaire vierge n'est pas un brouillon : sans catégorie, sans
 * description et sans photo, il n'y a rien à retenir — et surtout rien à
 * proposer de restaurer au prochain passage.
 */
export function isWorthSaving(draft: Omit<ReportDraft, "savedAt">): boolean {
  return (
    draft.type !== null ||
    draft.description.trim().length > 0 ||
    draft.photos.length > 0
  );
}
