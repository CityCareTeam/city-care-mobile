import Constants from "expo-constants";

/**
 * Lecture et découpage de la version de l'application.
 *
 * Regroupé ici parce que trois consommateurs en avaient besoin — le pied de
 * page, les notes de version et le repère de build — et que deux d'entre eux
 * avaient fini par recopier le même découpage de chaîne.
 *
 * Tout est lu au moment de l'appel, jamais figé dans une constante de module :
 * une valeur capturée au premier import est intestable et surprend au premier
 * rechargement à chaud.
 */

/** `1.5.6-beta.3` tel quel. */
export function appVersion(): string {
  return Constants.expoConfig?.version ?? "0.0.0";
}

/**
 * Étiquette du canal, posée par `app.config.ts` selon le profil de build EAS.
 * Absente en production — il n'y a alors rien à signaler.
 */
export function releaseTag(): string | null {
  const tag = Constants.expoConfig?.extra?.releaseTag;
  // La sérialisation de la config transforme `null` en objet vide, qui est
  // truthy : on exige donc une vraie chaîne.
  if (typeof tag !== "string" || tag.length === 0) return null;
  // `none` est la sentinelle d'absence de canal utilisée par `eas.json`, qui
  // n'accepte pas de chaîne vide dans `env`. `app.config.ts` la neutralise déjà
  // en amont ; on la refuse aussi ici, pour qu'aucun chemin ne puisse afficher
  // un badge « NONE » en production.
  return tag === "none" ? null : tag;
}

/** `1.5.6-beta.3` → `1.5.6` : la version livrée que la build vise. */
export function baseVersion(full: string = appVersion()): string {
  const dash = full.indexOf("-");
  return dash === -1 ? full : full.slice(0, dash);
}

/**
 * `1.5.6-beta.3` → `beta.3`, vide sur une version livrée.
 *
 * Le pendant complet de `buildLabel`, qui ne garde que le rang. Les deux ont
 * leur usage : la pastille de version affiche le rang seul, faute de place, mais
 * l'écran des mises à jour a la place de nommer le canal — et sans ce nom, un
 * « 3 » isolé ne dit pas de quoi il est le troisième.
 */
export function preRelease(full: string = appVersion()): string {
  const dash = full.indexOf("-");
  return dash === -1 ? "" : full.slice(dash + 1);
}

/** `1.5.6-beta.3` → `3`, vide s'il n'y a pas de repère. */
export function buildLabel(full: string = appVersion()): string {
  const dash = full.indexOf("-");
  if (dash === -1) return "";
  // Découpage au *premier* tiret : un repère nommé peut en contenir
  // (`1.5.6-beta.fix-clusters`), et un `split("-")` le tronquerait à « fix ».
  return full.slice(dash + 1).split(".").slice(1).join(".");
}

/** `1.5.5` → `1.5` */
export function minorOf(version: string): string {
  const [major, minor] = version.split(".");
  return `${major}.${minor}`;
}
