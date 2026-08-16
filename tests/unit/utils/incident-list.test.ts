import { appendUnique, mergeFreshHead } from '@/utils/incident-list';

const inc = (id: string, status = 'reported') => ({ id, status });

describe('appendUnique', () => {
  it('ajoute la page suivante à la suite', () => {
    expect(appendUnique([inc('a'), inc('b')], [inc('c')])).toEqual([inc('a'), inc('b'), inc('c')]);
  });

  // Un signalement créé entre deux requêtes décale les pages d'un cran : la
  // ligne de tête de la page suivante est alors déjà en mémoire.
  it('ignore ce qu’on tient déjà', () => {
    const result = appendUnique([inc('a'), inc('b')], [inc('b'), inc('c')]);
    expect(result.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('garde la version déjà chargée en cas de doublon', () => {
    const result = appendUnique([inc('a', 'resolved')], [inc('a', 'reported')]);
    expect(result).toEqual([inc('a', 'resolved')]);
  });

  it('accepte une page vide', () => {
    expect(appendUnique([inc('a')], [])).toEqual([inc('a')]);
  });
});

describe('mergeFreshHead', () => {
  // Les nouveaux signalements arrivent en tête, la liste étant triée par date
  // décroissante.
  it('place la page fraîche en tête', () => {
    const result = mergeFreshHead([inc('b'), inc('c')], [inc('a'), inc('b')]);
    expect(result.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  // C'est tout l'intérêt du rafraîchissement silencieux : voir les statuts
  // bouger sans recharger l'écran.
  it('remplace la version périmée de ce qu’elle contient', () => {
    const result = mergeFreshHead([inc('a', 'reported')], [inc('a', 'resolved')]);
    expect(result).toEqual([inc('a', 'resolved')]);
  });

  // Recharger la première page ne doit pas refermer les suivantes.
  it('conserve les pages au-delà de la première', () => {
    const loaded = [inc('a'), inc('b'), inc('c'), inc('d')];
    const result = mergeFreshHead(loaded, [inc('a'), inc('b')]);
    expect(result.map((i) => i.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('ne duplique rien quand rien n’a changé', () => {
    const loaded = [inc('a'), inc('b')];
    expect(mergeFreshHead(loaded, loaded)).toEqual(loaded);
  });
});
