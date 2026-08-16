import { AppVersion } from '@/components/ui/AppVersion';
import { render, within } from '@testing-library/react-native';

const expoConfig: { version: string; extra: Record<string, unknown> } = {
  version: '1.5.5-beta',
  extra: {},
};

jest.mock('expo-constants', () => ({ __esModule: true, default: { get expoConfig() { return expoConfig; } } }));

// Bundle en cours d'exécution. Par défaut celui embarqué dans l'APK — l'état
// de tout appareil qui n'a pas encore reçu de mise à jour à la volée.
const running: { updateId: string | null; isEmbeddedLaunch: boolean } = {
  updateId: null,
  isEmbeddedLaunch: true,
};

jest.mock('expo-updates', () => ({
  useUpdates: () => ({ isUpdatePending: false, currentlyRunning: running }),
  reloadAsync: () => Promise.resolve(),
}));

beforeEach(() => {
  running.updateId = null;
  running.isEmbeddedLaunch = true;
});

function renderVersion(version: string, extra: Record<string, unknown>) {
  expoConfig.version = version;
  expoConfig.extra = extra;
  return render(<AppVersion />);
}

describe('AppVersion', () => {
  // Le badge dit déjà « BETA » : répéter le suffixe dans le numéro n'apprend rien.
  it('affiche le numéro sans son suffixe de pré-version', () => {
    const { getByText, queryByText } = renderVersion('1.5.5-beta', { releaseTag: 'beta' });
    expect(getByText('v1.5.5')).toBeTruthy();
    expect(queryByText('v1.5.5-beta')).toBeNull();
  });

  it('affiche le badge du canal en majuscules', () => {
    const { getByText } = renderVersion('1.5.5-beta', { releaseTag: 'beta' });
    expect(getByText('BETA')).toBeTruthy();
  });

  it('porte l’étiquette du profil, pas un libellé figé', () => {
    const { getByText } = renderVersion('1.5.5-rc', { releaseTag: 'rc' });
    expect(getByText('RC')).toBeTruthy();
  });

  // En production la clé est absente de la config : un utilisateur final n'a
  // pas à se demander ce qu'est une « beta ».
  it('n’affiche aucun badge en production', () => {
    const { getByText, queryByText } = renderVersion('1.5.4', {});
    expect(getByText('v1.5.4')).toBeTruthy();
    expect(queryByText('BETA')).toBeNull();
  });

  // Deux beta successives portent le même numéro de version : leur rang est la
  // seule chose qui les distingue. Le croisillon le donne à lire comme tel —
  // « 3 » posé seul à côté du badge ne veut rien dire.
  it('affiche le rang de la pré-version', () => {
    const { getByText } = renderVersion('1.5.5-beta.3', { releaseTag: 'beta' });
    expect(getByText('v1.5.5')).toBeTruthy();
    expect(getByText('BETA')).toBeTruthy();
    expect(getByText('#3')).toBeTruthy();
  });

  // Le rang vit *dans* la pastille, derrière un filet. Posé à côté, il flottait
  // entre deux blancs et se lisait comme une note de bas de page.
  it('loge le rang dans la pastille du canal', () => {
    const { getByTestId } = renderVersion('1.5.5-beta.3', { releaseTag: 'beta' });
    const badge = within(getByTestId('release-badge'));
    expect(badge.getByText('BETA')).toBeTruthy();
    expect(badge.getByText('#3')).toBeTruthy();
  });

  // Depuis l'OTA, le rang de build ne suffit plus : deux appareils portant la
  // même beta #3 peuvent exécuter deux JS différents.
  it('ajoute le bundle appliqué à la pastille', () => {
    running.updateId = 'a1b2c3d4-0000-0000-0000-000000000000';
    running.isEmbeddedLaunch = false;
    const { getByTestId } = renderVersion('1.5.5-beta.3', { releaseTag: 'beta' });
    const badge = within(getByTestId('release-badge'));
    expect(badge.getByText('#3')).toBeTruthy();
    expect(badge.getByText('a1b2c3d4')).toBeTruthy();
  });

  // Sur un APK fraîchement installé il n'y a rien à distinguer : l'afficher
  // quand même n'aurait été que du bruit.
  it('n’affiche aucun bundle sur le JS embarqué', () => {
    running.updateId = 'a1b2c3d4-0000-0000-0000-000000000000';
    const { queryByText } = renderVersion('1.5.5-beta.3', { releaseTag: 'beta' });
    expect(queryByText('a1b2c3d4')).toBeNull();
  });

  // Un repère nommé se suffit à lui-même : pas de croisillon devant.
  it('accepte un repère nommé', () => {
    const { getByText } = renderVersion('1.5.5-beta.fix-clusters', { releaseTag: 'beta' });
    expect(getByText('fix-clusters')).toBeTruthy();
  });

  // Sans rang, pas de segment : la pastille reste une pastille simple.
  it('n’ajoute pas de filet quand il n’y a pas de rang', () => {
    const { getByTestId } = renderVersion('1.5.5-beta', { releaseTag: 'beta' });
    const badge = getByTestId('release-badge');
    // Le point de couleur et le libellé, rien de plus.
    expect(badge.children).toHaveLength(2);
  });

  it('n’affiche pas de repère quand il n’y en a pas', () => {
    const { getByText, queryByText } = renderVersion('1.5.5-beta', { releaseTag: 'beta' });
    expect(getByText('BETA')).toBeTruthy();
    expect(queryByText('beta')).toBeNull();
  });

  it('décrit le canal aux lecteurs d’écran', () => {
    const { getByLabelText } = renderVersion('1.5.5-beta', { releaseTag: 'beta' });
    expect(getByLabelText("Version 1.5.5, version d'essai beta")).toBeTruthy();
  });

  // EAS refuse une chaîne vide dans `env` : production déclare donc `none`.
  // Sans ce filtre, le badge aurait affiché « NONE » en production.
  it('traite la sentinelle « none » comme une absence de canal', () => {
    const { getByText, queryByText } = renderVersion('1.5.4', { releaseTag: 'none' });
    expect(getByText('v1.5.4')).toBeTruthy();
    expect(queryByText('NONE')).toBeNull();
  });

  it('ignore une étiquette qui n’est pas une chaîne', () => {
    const { queryByText } = renderVersion('1.5.4', { releaseTag: {} });
    expect(queryByText('BETA')).toBeNull();
  });
});
