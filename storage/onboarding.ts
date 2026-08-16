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
