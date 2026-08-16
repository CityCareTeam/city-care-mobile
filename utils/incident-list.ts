/**
 * Assemblage d'une liste paginée.
 *
 * Deux mouvements, et un seul invariant : jamais deux fois le même identifiant.
 * Le serveur pagine sur un jeu qui bouge — un signalement créé entre deux
 * requêtes décale les pages d'un cran, et la ligne qui se trouvait en tête de
 * la page suivante revient une seconde fois. Sans déduplication, React se
 * plaint d'une clé répétée et l'utilisateur voit un doublon.
 */

type WithId = { id: string };

/**
 * Ajoute une page à la suite, en ignorant ce qu'on tient déjà.
 */
export function appendUnique<T extends WithId>(existing: T[], incoming: T[]): T[] {
  const known = new Set(existing.map((item) => item.id));
  return [...existing, ...incoming.filter((item) => !known.has(item.id))];
}

/**
 * Rafraîchit la tête de liste sans jeter les pages suivantes.
 *
 * Le rafraîchissement silencieux ne recharge que la première page : tout
 * relire serait une requête par page déjà ouverte, toutes les quinze secondes.
 * La page fraîche prend la tête — c'est là qu'arrivent les nouveaux
 * signalements, la liste étant triée par date décroissante — et remplace au
 * passage les versions périmées de ce qu'elle contient, dont les statuts qui
 * ont changé.
 *
 * Ce qu'elle ne rattrape pas : un signalement supprimé au-delà de la première
 * page, qui restera affiché jusqu'au prochain tiré-pour-rafraîchir. C'est le
 * prix d'une seule requête, et le geste de rattrapage est à portée de pouce.
 */
export function mergeFreshHead<T extends WithId>(existing: T[], fresh: T[]): T[] {
  const refreshed = new Set(fresh.map((item) => item.id));
  return [...fresh, ...existing.filter((item) => !refreshed.has(item.id))];
}
