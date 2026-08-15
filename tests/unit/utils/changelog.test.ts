import { CHANGELOG } from '@/constants/changelog';
import { minorOf } from '@/utils/app-version';
import { changelogFor, groupByMinor, isReleased } from '@/utils/changelog';
import { GENERATED_CHANGELOG, UNRELEASED_CHANGES } from '@/constants/changelog.generated';

describe('changelog', () => {
  it('reprend tout l’historique git', () => {
    expect(GENERATED_CHANGELOG.length).toBeGreaterThanOrEqual(20);
  });

  it('trie de la plus récente à la plus ancienne', () => {
    const versions = CHANGELOG.map((n) => n.version);
    const sorted = [...versions].sort((a, b) => {
      const l = a.split('.').map(Number), r = b.split('.').map(Number);
      return r[0] - l[0] || r[1] - l[1] || r[2] - l[2];
    });
    expect(versions).toEqual(sorted);
  });

  it('ne garde aucune version sans changement', () => {
    CHANGELOG.forEach((n) => expect(n.changes.length).toBeGreaterThan(0));
  });

  // Une surcharge dont le numéro n'a pas de tag ajoute la version en préparation.
  it('intègre une version non encore livrée', () => {
    expect(CHANGELOG.some((n) => n.version === '1.5.5')).toBe(true);
    expect(isReleased('1.5.5')).toBe(false);
    expect(isReleased('1.5.4')).toBe(true);
  });

  it('laisse les surcharges reformuler une version générée', () => {
    const note = CHANGELOG.find((n) => n.version === '1.5.4');
    expect(note?.changes[0].text).toMatch(/arrière-plan/);
  });

  describe('groupByMinor', () => {
    it('regroupe les correctifs sous leur palier', () => {
      const groups = groupByMinor();
      const minors = groups.map((g) => g.minor);
      expect(minors).toContain('1.5');
      expect(minors).toContain('1.2');
      expect(new Set(minors).size).toBe(minors.length);
    });

    it('compte les changements du palier', () => {
      const group = groupByMinor().find((g) => g.minor === '1.2');
      expect(group!.changeCount).toBe(
        group!.releases.reduce((n, r) => n + r.changes.length, 0),
      );
    });

    it('place la version la plus récente en tête du palier', () => {
      const group = groupByMinor().find((g) => g.minor === '1.5');
      expect(group!.releases[0].version).toBe('1.5.5');
      expect(group!.latestDate).toBe(group!.releases[0].date);
    });
  });

  describe('changelogFor', () => {
    it('renvoie le journal tel quel pour une version publiée', () => {
      expect(changelogFor('1.5.4')).toBe(CHANGELOG);
    });

    // Une version déjà décrite par une surcharge n'a pas à être reconstruite.
    it('ne double pas une version déjà présente au journal', () => {
      const notes = changelogFor('1.5.5');
      expect(notes.filter((n) => n.version === '1.5.5')).toHaveLength(1);
    });

    // Ce cas dépend de l'historique git au moment de la génération : on décrit
    // donc le contrat des deux côtés plutôt que de figer l'état du dépôt. La
    // version précédente de ce test supposait la liste vide et cassait dès le
    // premier commit non publié.
    it('rattache les changements en attente à la version demandée', () => {
      const notes = changelogFor('9.9.9');

      if (UNRELEASED_CHANGES.length === 0) {
        expect(notes).toBe(CHANGELOG);
        return;
      }

      expect(notes[0].version).toBe('9.9.9');
      expect(notes[0].changes).toBe(UNRELEASED_CHANGES);
      expect(notes.slice(1)).toEqual(CHANGELOG);
    });
  });

  it('minorOf ignore le patch', () => {
    expect(minorOf('1.5.5')).toBe('1.5');
    expect(minorOf('10.2.13')).toBe('10.2');
  });
});
