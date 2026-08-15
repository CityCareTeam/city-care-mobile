jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');

// Journal de fixture, et non le journal réel du dépôt.
//
// Ce fichier décrit un cas qui n'existe que le temps d'un cycle : une version
// que la branche prépare, sans tag git, et les changements qu'elle embarque.
// Branché sur les fichiers générés, il affirmait « 1.5.5 n'est pas publiée » —
// vrai jusqu'à la release de la 1.5.5, faux le lendemain, et la CI rouge sur
// `dev` sans qu'une ligne de code applicatif ait bougé.
//
// Les surcharges sont neutralisées de la même façon : elles décrivent de vraies
// versions du produit, dont aucune n'a sa place dans ce scénario.
jest.mock('@/constants/changelog.generated', () => ({
  GENERATED_CHANGELOG: [
    {
      version: '2.0.0',
      date: '2026-08-01',
      changes: [{ kind: 'fix', text: 'Un correctif déjà publié.' }],
    },
  ],
  LAST_RELEASED_VERSION: '2.0.0',
  UNRELEASED_CHANGES: [{ kind: 'feature', text: 'Une nouveauté pas encore publiée.' }],
}));

jest.mock('@/constants/changelog-overrides', () => ({ CHANGELOG_OVERRIDES: {} }));

const expoConfig: { version: string; extra: Record<string, unknown> } = { version: '2.0.0', extra: {} };
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { get expoConfig() { return expoConfig; } },
}));

import { ReleaseNotesModal } from '@/components/profile/ReleaseNotesModal';
import { render } from '@testing-library/react-native';

function open(version: string, extra: Record<string, unknown> = {}) {
  expoConfig.version = version;
  expoConfig.extra = extra;
  return render(<ReleaseNotesModal visible onClose={jest.fn()} />);
}

describe('ReleaseNotesModal — version en préparation', () => {
  // La beta vise la 2.0.1, qu'aucun tag ne décrit : le journal la reconstruit à
  // partir des changements en attente, et la donne pour ce qu'elle est.
  it('annonce qu’une version sans tag git n’est pas publiée', () => {
    const { getByText } = open('2.0.1-beta.3', { releaseTag: 'beta' });
    expect(getByText('2.0.1')).toBeTruthy();
    expect(getByText('BETA · à venir')).toBeTruthy();
  });

  it('liste les changements que la pré-version embarque', () => {
    const { getByText } = open('2.0.1-beta.3', { releaseTag: 'beta' });
    expect(getByText('Une nouveauté pas encore publiée.')).toBeTruthy();
  });

  // Sans canal, pas de pastille : les versions du journal sont toutes tagguées.
  it('ne signale rien sur une version publiée', () => {
    const { queryByText } = open('2.0.0', {});
    expect(queryByText(/à venir/)).toBeNull();
  });
});
