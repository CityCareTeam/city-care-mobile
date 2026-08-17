import { readJson, writeJson } from "@/storage/local-store";

const KEY = "consent";

type Consent = {
  /** Instant où la question a été posée et tranchée, dans un sens ou l'autre. */
  locationAskedAt: string;
};

/**
 * Trace du consentement à la localisation.
 *
 * Séparée de la préférence elle-même, et c'est le point : `location: false` peut
 * vouloir dire « j'ai refusé » comme « on ne m'a rien demandé ». Le RGPD
 * distingue les deux — le premier est un consentement recueilli, le second une
 * absence de consentement — et sans cette trace l'application redemanderait
 * indéfiniment à quelqu'un qui a déjà dit non.
 *
 * On ne garde que la date, pas la réponse : la réponse *est* la préférence, et
 * la dupliquer serait s'exposer à ce que les deux divergent.
 */
export async function locationAsked(): Promise<boolean> {
  const stored = await readJson<Consent>(KEY);
  return typeof stored?.locationAskedAt === "string";
}

export async function markLocationAsked(): Promise<void> {
  await writeJson(KEY, { locationAskedAt: new Date().toISOString() } satisfies Consent);
}
