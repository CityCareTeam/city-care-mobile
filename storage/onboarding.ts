import { readJson, writeJson } from "@/storage/local-store";

const KEY = "onboarding";

/**
 * Édition du guide.
 *
 * À incrémenter le jour où le guide change assez pour mériter d'être remontré —
 * une fonctionnalité nouvelle, un geste qui bouge. Les appareils qui ont vu une
 * édition antérieure le reverront une fois, les autres non.
 *
 * Sans ce numéro, il aurait fallu choisir entre ne jamais le remontrer et le
 * remontrer à tout le monde à chaque mise à jour.
 */
export const GUIDE_EDITION = 1;

type Onboarding = {
  seenEdition: number;
};

/** A-t-on déjà montré cette édition du guide sur cet appareil ? */
export async function hasSeenGuide(): Promise<boolean> {
  const stored = await readJson<Onboarding>(KEY);
  return typeof stored?.seenEdition === "number" && stored.seenEdition >= GUIDE_EDITION;
}

export async function markGuideSeen(): Promise<void> {
  await writeJson(KEY, { seenEdition: GUIDE_EDITION });
}

/**
 * Oublie que le guide a été vu — il repassera au prochain lancement.
 *
 * Écrit l'édition zéro plutôt que d'effacer la clé : les deux se valent à la
 * lecture, mais un enregistrement présent dit « on a décidé de le revoir »,
 * quand une clé absente ne se distingue pas d'une installation neuve.
 */
export async function forgetGuide(): Promise<void> {
  await writeJson(KEY, { seenEdition: 0 });
}
