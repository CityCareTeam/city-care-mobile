import { readJson, writeJson } from "@/storage/local-store";

const KEY = "hidden_content";

type Hidden = { incidents: string[]; messages: string[] };

const EMPTY: Hidden = { incidents: [], messages: [] };

/**
 * Contenus masqués sur cet appareil.
 *
 * Ce n'est **pas** de la modération, et il importe de ne pas les confondre :
 * masquer ici ne retire rien pour personne d'autre. C'est le pendant du geste
 * « je ne veux plus voir ça », qui doit prendre effet immédiatement — celui qui
 * vient de signaler une insulte ne va pas la relire à chaque ouverture du fil en
 * attendant qu'un modérateur passe.
 *
 * Deux listes et non une : un identifiant de message et un identifiant de
 * signalement pourraient coïncider, et masquer l'un ferait alors disparaître
 * l'autre.
 */
export async function loadHidden(): Promise<Hidden> {
  const stored = await readJson<Partial<Hidden>>(KEY);
  return {
    incidents: Array.isArray(stored?.incidents) ? stored.incidents : [],
    messages: Array.isArray(stored?.messages) ? stored.messages : [],
  };
}

export async function hide(kind: keyof Hidden, id: string): Promise<Hidden> {
  const current = await loadHidden();
  if (current[kind].includes(id)) return current;

  const next: Hidden = { ...current, [kind]: [...current[kind], id] };
  await writeJson(KEY, next);
  return next;
}

/**
 * Remontre un contenu.
 *
 * Le geste inverse existe parce qu'on se trompe : masquer d'un appui, sans
 * pouvoir revenir, transforme une maladresse en perte définitive.
 */
export async function unhide(kind: keyof Hidden, id: string): Promise<Hidden> {
  const current = await loadHidden();
  const next: Hidden = { ...current, [kind]: current[kind].filter((kept) => kept !== id) };
  await writeJson(KEY, next);
  return next;
}

export async function clearHidden(): Promise<void> {
  await writeJson(KEY, EMPTY);
}
