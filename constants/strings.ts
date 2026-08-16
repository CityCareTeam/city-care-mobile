import { getStrings, type Dictionary } from "@/constants/i18n";

/**
 * Textes de l'application, dans la langue active.
 *
 * Ce fichier portait les chaînes en dur. Elles vivent maintenant dans
 * `constants/i18n/`, une par langue — mais une quinzaine de fichiers lisent
 * `STRINGS.api.networkError` et consorts, et ces lectures se font pour la
 * plupart dans des gestionnaires d'événements, hors de tout rendu.
 *
 * D'où ce relais : chaque accès interroge la langue active plutôt qu'une valeur
 * figée à l'import. Une alerte déclenchée après un changement de langue sort
 * dans la bonne, sans que l'appelant ait à s'en occuper.
 *
 * Pour du texte *affiché*, préférez `useStrings()` : il redéclenche le rendu au
 * changement de langue, ce qu'un objet ne peut pas faire.
 */
export const STRINGS = new Proxy({} as Dictionary, {
  get: (_target, key: string) => getStrings()[key as keyof Dictionary],
});
