import { detectFollowedChanges } from '@/utils/followed-changes';

const followed = (...ids: string[]) => new Set(ids);

describe('detectFollowedChanges', () => {
  it('repère un changement de statut', () => {
    const { changes } = detectFollowedChanges(
      [{ id: 'a', status: 'in_progress' }],
      followed('a'),
      { a: 'reported' },
    );
    expect(changes).toEqual([{ id: 'a', from: 'reported', to: 'in_progress' }]);
  });

  // Sans cette règle, suivre un signalement déclencherait aussitôt une alerte
  // sur son propre geste.
  it('se tait sur un signalement qu’on découvre', () => {
    const { changes, statuses } = detectFollowedChanges(
      [{ id: 'a', status: 'reported' }],
      followed('a'),
      {},
    );
    expect(changes).toEqual([]);
    expect(statuses.a).toBe('reported');
  });

  it('ignore ce qui n’est pas suivi', () => {
    const { changes } = detectFollowedChanges(
      [{ id: 'b', status: 'resolved' }],
      followed('a'),
      { b: 'reported' },
    );
    expect(changes).toEqual([]);
  });

  it('ne dit rien quand rien ne bouge', () => {
    const { changes } = detectFollowedChanges(
      [{ id: 'a', status: 'reported' }],
      followed('a'),
      { a: 'reported' },
    );
    expect(changes).toEqual([]);
  });

  // Le fil est paginé : un suivi absent de la page reçue n'a pas disparu, il
  // est plus bas. L'oublier ferait crier au changement à son retour.
  it('garde en mémoire un suivi absent de la liste', () => {
    const { changes, statuses } = detectFollowedChanges([], followed('a'), { a: 'reported' });
    expect(changes).toEqual([]);
    expect(statuses.a).toBe('reported');
  });

  // Sans quoi la table grossirait indéfiniment.
  it('oublie ce qu’on ne suit plus', () => {
    const { statuses } = detectFollowedChanges([], followed('a'), { a: 'reported', b: 'resolved' });
    expect(statuses).toEqual({ a: 'reported' });
  });

  it('remonte plusieurs changements à la fois', () => {
    const { changes } = detectFollowedChanges(
      [
        { id: 'a', status: 'resolved' },
        { id: 'b', status: 'in_progress' },
      ],
      followed('a', 'b'),
      { a: 'in_progress', b: 'reported' },
    );
    expect(changes).toHaveLength(2);
  });
});
