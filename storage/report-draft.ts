import { readJson, removeKey, writeJson } from "@/storage/local-store";
import type { IncidentType } from "@/types/incidents";

const KEY = "report_drafts";

/** Ancienne clé, du temps où l'on n'en gardait qu'un. Voir `migrate()`. */
const LEGACY_KEY = "report_draft";

/**
 * Un brouillon plus vieux que ça ne se restaure plus. Retrouver dix jours plus
 * tard un formulaire à moitié rempli devant un nid-de-poule sans doute déjà
 * rebouché n'aide personne — et les photos, elles, auront de toute façon
 * disparu du cache de l'appareil.
 */
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Au-delà, on cesse d'en garder. Personne ne tient dix signalements en cours ;
 * une liste sans fin deviendrait un cimetière qu'il faudrait ranger à la main.
 * Le plus ancien cède la place.
 */
const MAX_DRAFTS = 5;

export type DraftPhoto = {
  uri: string;
  fileName: string;
  mimeType: string;
};

export type DraftContent = {
  latitude: number;
  longitude: number;
  addressQuery: string;
  description: string;
  type: IncidentType | null;
  photos: DraftPhoto[];
};

export type ReportDraft = DraftContent & {
  id: string;
  savedAt: string;
};

/**
 * Brouillons du formulaire de signalement.
 *
 * Le cas qu'on cherche à couvrir est celui du terrain : quelqu'un est dehors,
 * la photo est prise, la description à moitié tapée, et un appel entrant ou le
 * système reprend la main sur l'application. Sans brouillon, tout est à
 * refaire — et c'est précisément le moment où l'on renonce à signaler.
 *
 * Ils sont plusieurs depuis qu'on a constaté l'autre moitié du problème :
 * quelqu'un qui repère trois choses en marchant ne pouvait en préparer qu'une,
 * la suivante écrasant la précédente sans prévenir.
 *
 * ⚠️ Les photos ne sont pas copiées, seules leurs URI le sont. Elles pointent
 * vers le cache d'`expo-image-picker`, que le système peut vider. Un brouillon
 * restauré peut donc avoir perdu ses images ; l'envoi le signalera comme
 * n'importe quel échec d'upload. Les recopier dans un dossier à nous
 * demanderait `expo-file-system`, une dépendance de plus pour un cas de bord.
 */

/**
 * Reprend le brouillon unique de l'ancienne version, s'il en reste un.
 *
 * Sans ça, la mise à jour aurait fait disparaître le travail en cours de tous
 * ceux qui avaient un formulaire ouvert — exactement ce que cette
 * fonctionnalité existe pour éviter.
 */
async function migrate(): Promise<ReportDraft[]> {
  const legacy = await readJson<Omit<ReportDraft, "id">>(LEGACY_KEY);
  if (!legacy || typeof legacy.savedAt !== "string") return [];

  const adopted: ReportDraft = { ...legacy, id: newId() };
  await writeJson(KEY, [adopted]);
  await removeKey(LEGACY_KEY);
  return [adopted];
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isFresh(draft: ReportDraft): boolean {
  const age = Date.now() - new Date(draft.savedAt).getTime();
  return Number.isFinite(age) && age <= MAX_AGE_MS;
}

/** Les brouillons encore valides, du plus récent au plus ancien. */
export async function listDrafts(): Promise<ReportDraft[]> {
  const stored = await readJson<ReportDraft[]>(KEY);
  const drafts = Array.isArray(stored) ? stored : await migrate();

  const fresh = drafts
    .filter((draft) => draft && typeof draft.savedAt === "string" && isFresh(draft))
    .sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt));

  // Le ménage se fait à la lecture : rien ne sert de purger à heure fixe une
  // liste que personne ne regarde.
  if (fresh.length !== drafts.length) await writeJson(KEY, fresh);
  return fresh;
}

/** Le plus récent, celui qu'on rouvre par défaut. */
export async function latestDraft(): Promise<ReportDraft | null> {
  return (await listDrafts())[0] ?? null;
}

/**
 * Enregistre, en écrasant le brouillon d'identifiant donné ou en en créant un.
 * Renvoie l'identifiant retenu, que l'écran garde pour les écritures suivantes.
 */
export async function saveDraft(content: DraftContent, id?: string): Promise<string> {
  const drafts = await listDrafts();
  const draftId = id ?? newId();
  const saved: ReportDraft = { ...content, id: draftId, savedAt: new Date().toISOString() };

  const next = [saved, ...drafts.filter((draft) => draft.id !== draftId)].slice(0, MAX_DRAFTS);
  await writeJson(KEY, next);
  return draftId;
}

export async function clearDraft(id: string): Promise<void> {
  const drafts = await listDrafts();
  await writeJson(KEY, drafts.filter((draft) => draft.id !== id));
}

export async function clearAllDrafts(): Promise<void> {
  await removeKey(KEY);
  await removeKey(LEGACY_KEY);
}

/**
 * Un formulaire vierge n'est pas un brouillon : sans catégorie, sans
 * description et sans photo, il n'y a rien à retenir — et surtout rien à
 * proposer de restaurer au prochain passage.
 */
export function isWorthSaving(draft: DraftContent): boolean {
  return (
    draft.type !== null ||
    draft.description.trim().length > 0 ||
    draft.photos.length > 0
  );
}
