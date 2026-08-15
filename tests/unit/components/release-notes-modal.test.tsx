jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');

const expoConfig: { version: string; extra: Record<string, unknown> } = { version: '1.5.5', extra: {} };
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { get expoConfig() { return expoConfig; } },
}));

import { ReleaseNotesModal } from '@/components/profile/ReleaseNotesModal';
import { groupByMinor } from '@/utils/changelog';
import { fireEvent, render } from '@testing-library/react-native';

function open(version: string, extra: Record<string, unknown> = {}) {
  expoConfig.version = version;
  expoConfig.extra = extra;
  return render(<ReleaseNotesModal visible onClose={jest.fn()} />);
}

describe('ReleaseNotesModal', () => {
  it('liste tous les paliers mineurs', () => {
    const { getByText } = open('1.5.5');
    groupByMinor().forEach((group) => {
      expect(getByText(`Version ${group.minor}`)).toBeTruthy();
    });
  });

  // Vingt-huit versions à plat sont illisibles : seul le palier de la version
  // installée s'ouvre, les autres restent repliés.
  it('n’ouvre que le palier de la version installée', () => {
    const { getByText, queryByText } = open('1.5.5');
    expect(getByText('1.5.5')).toBeTruthy();
    expect(queryByText('1.2.14')).toBeNull();
  });

  it('déplie un palier au clic', () => {
    const { getByText, queryByText } = open('1.5.5');
    expect(queryByText('1.2.14')).toBeNull();
    fireEvent.press(getByText('Version 1.2'));
    expect(getByText('1.2.14')).toBeTruthy();
  });

  it('replie le palier ouvert', () => {
    const { getByText, queryByText } = open('1.5.5');
    fireEvent.press(getByText('Version 1.5'));
    expect(queryByText('1.5.5')).toBeNull();
  });

  it('repère la version installée', () => {
    const { getByText } = open('1.5.5');
    expect(getByText('Votre version')).toBeTruthy();
  });

  // Une beta de la 1.5.5 doit se reconnaître dans le bloc 1.5.5 : sans retirer
  // le suffixe, elle ne correspondrait à aucune version du journal.
  it('reconnaît une pré-version comme étant sa version cible', () => {
    const { getByText } = open('1.5.5-beta.3', { releaseTag: 'beta' });
    expect(getByText('Votre version')).toBeTruthy();
  });

  // La pastille « à venir » d'une version sans tag se teste sur un journal de
  // fixture — voir `release-notes-modal-pending.test.tsx`. Branchée sur le
  // journal réel, elle tombait le jour où la version visée sortait.
  describe('version non livrée', () => {
    it('explique en tête que la version installée est un essai', () => {
      const { getByText } = open('1.5.5-beta.3', { releaseTag: 'beta' });
      expect(getByText(/n'est pas encore publiée/)).toBeTruthy();
    });

    it('n’affiche aucun bandeau sur une version de production', () => {
      const { queryByText } = open('1.5.4', {});
      expect(queryByText(/n'est pas encore publiée/)).toBeNull();
    });
  });

  it('date les versions en français', () => {
    const { getByText } = open('1.5.5');
    expect(getByText('14 août 2026')).toBeTruthy();
  });

  describe('frise', () => {
    it('résume la période et le nombre de publications de chaque palier', () => {
      const { getAllByText } = open('1.5.5');
      expect(getAllByText(/2026 · \d+ publication/).length).toBe(groupByMinor().length);
    });

    it('accorde le nombre de publications', () => {
      const { getAllByText } = open('1.5.5');
      // 1.3 ne contient que la 1.3.0, 1.2 en contient quatorze.
      expect(getAllByText(/· 1 publication$/).length).toBeGreaterThan(0);
      expect(getAllByText(/· \d\d publications$/).length).toBeGreaterThan(0);
    });

    // La silhouette d'un palier doit se lire sans le déplier.
    it('chiffre les natures de changement sur un palier replié', () => {
      const { getByLabelText } = open('1.5.5');
      const fixes = groupByMinor()
        .find((g) => g.minor === '1.2')!
        .releases.reduce((n, r) => n + r.changes.filter((c) => c.kind === 'fix').length, 0);
      expect(getByLabelText(`${fixes} Corrigé`)).toBeTruthy();
    });

    // Une étiquette par section, pas une par ligne : la 1.5.5 compte quatre
    // correctifs et ne doit afficher « Corrigé » qu'une seule fois.
    it('coiffe chaque nature d’une seule étiquette par version', () => {
      const { getAllByText } = open('1.5.5');
      const expanded = groupByMinor().find((g) => g.minor === '1.5')!;
      const releasesWithFix = expanded.releases.filter((r) =>
        r.changes.some((c) => c.kind === 'fix'),
      ).length;

      expect(getAllByText('Corrigé').length).toBe(releasesWithFix);
      expect(expanded.releases[0].changes.filter((c) => c.kind === 'fix').length)
        .toBeGreaterThan(1);
    });
  });
});
