import { UpdatesModal } from '@/components/app/UpdatesModal';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

const state = { isUpdatePending: false };
const mockCheck = jest.fn();
const expoConfig: { version: string } = { version: '1.6.0-beta.3' };

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return expoConfig;
    },
  },
}));

jest.mock('expo-updates', () => ({
  useUpdates: () => ({ ...state, currentlyRunning: { updateId: null, isEmbeddedLaunch: true } }),
  reloadAsync: () => Promise.resolve(),
  channel: 'beta',
  isEnabled: true,
}));

jest.mock('@/hooks/use-app-update', () => {
  const actual = jest.requireActual('@/hooks/use-app-update');
  return { ...actual, checkAndFetchUpdate: () => mockCheck() };
});

beforeEach(() => {
  state.isUpdatePending = false;
  mockCheck.mockReset();
  expoConfig.version = '1.6.0-beta.3';
});

async function press(label: string) {
  await act(async () => {
    fireEvent.press(screen.getByText(label));
  });
}

describe('UpdatesModal', () => {
  /**
   * L'apport de la mise en forme : les trois situations avaient le même
   * habillage orange, donc la même apparence. Chacune a maintenant son titre et
   * sa couleur — ces tests fixent au moins les titres.
   */
  it('annonce une application à jour', () => {
    render(<UpdatesModal visible onClose={() => {}} />);

    expect(screen.getByText('Application à jour')).toBeTruthy();
    expect(screen.getByText('Rechercher une mise à jour')).toBeTruthy();
  });

  it('annonce une mise à jour prête, et propose de relancer', () => {
    state.isUpdatePending = true;
    render(<UpdatesModal visible onClose={() => {}} />);

    expect(screen.getByText('Mise à jour prête')).toBeTruthy();
    expect(screen.getByText('Relancer maintenant')).toBeTruthy();
  });

  it('distingue un échec de recherche d’une application à jour', async () => {
    mockCheck.mockResolvedValue('failed');
    render(<UpdatesModal visible onClose={() => {}} />);

    await press('Rechercher une mise à jour');

    expect(screen.getByText('Recherche impossible')).toBeTruthy();
    expect(screen.queryByText('Application à jour')).toBeNull();
  });

  it('bascule sur « prête » quand la recherche ramène un bundle', async () => {
    mockCheck.mockResolvedValue('downloaded');
    render(<UpdatesModal visible onClose={() => {}} />);

    await press('Rechercher une mise à jour');

    expect(screen.getByText('Mise à jour prête')).toBeTruthy();
    expect(screen.getByText('Relancer maintenant')).toBeTruthy();
  });

  // Sans identifiant de bundle, on tourne sur celui livré avec l'APK : le dire
  // vaut mieux qu'un tiret, qui se lit comme une donnée manquante.
  it('nomme le bundle embarqué plutôt que de laisser un vide', () => {
    render(<UpdatesModal visible onClose={() => {}} />);
    expect(screen.getByText('Livré avec l’application')).toBeTruthy();
    expect(screen.getByText('beta')).toBeTruthy();
  });

  /**
   * Le rang de pré-version se détache de la version : c'est lui qu'on compare
   * entre deux appareils de test, pas le « 1.6.0 » qu'ils ont en commun.
   */
  it('sépare la version de son rang de pré-version', () => {
    expoConfig.version = '1.6.0-beta.3';
    render(<UpdatesModal visible onClose={() => {}} />);

    expect(screen.getByText('1.6.0')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('n’affiche pas de rang sur une version livrée', () => {
    expoConfig.version = '1.6.0';
    render(<UpdatesModal visible onClose={() => {}} />);

    expect(screen.getByText('1.6.0')).toBeTruthy();
    expect(screen.queryByText('3')).toBeNull();
  });
});
