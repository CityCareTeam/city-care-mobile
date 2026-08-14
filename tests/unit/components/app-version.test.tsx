import { AppVersion } from '@/components/ui/AppVersion';
import { render } from '@testing-library/react-native';

const expoConfig: { version: string; extra: Record<string, unknown> } = {
  version: '1.5.5-beta',
  extra: {},
};

jest.mock('expo-constants', () => ({ __esModule: true, default: { get expoConfig() { return expoConfig; } } }));

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

  // `null` sérialisé par la config Expo devient un objet vide, donc truthy :
  // le badge s'affichait en production et plantait sur `.toUpperCase()`.
  // Deux beta successives portent le même numéro : le repère de build est la
  // seule chose qui les distingue.
  it('affiche le repère de build à côté du badge', () => {
    const { getByText } = renderVersion('1.5.5-beta.2608142030', { releaseTag: 'beta' });
    expect(getByText('v1.5.5')).toBeTruthy();
    expect(getByText('BETA')).toBeTruthy();
    expect(getByText('2608142030')).toBeTruthy();
  });

  it('accepte un repère nommé', () => {
    const { getByText } = renderVersion('1.5.5-beta.fix-clusters', { releaseTag: 'beta' });
    expect(getByText('fix-clusters')).toBeTruthy();
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

  it('ignore une étiquette qui n’est pas une chaîne', () => {
    const { queryByText } = renderVersion('1.5.4', { releaseTag: {} });
    expect(queryByText('BETA')).toBeNull();
  });
});
