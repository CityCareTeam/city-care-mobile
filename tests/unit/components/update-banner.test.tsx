import { UpdateBanner } from '@/components/ui/UpdateBanner';
import { fireEvent, render } from '@testing-library/react-native';

const state = { isUpdatePending: false };
const mockReloadAsync = jest.fn(() => Promise.resolve());

jest.mock('expo-updates', () => ({
  useUpdates: () => ({ ...state, currentlyRunning: { updateId: null, isEmbeddedLaunch: true } }),
  reloadAsync: () => mockReloadAsync(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 0, left: 0, right: 0 }),
}));

beforeEach(() => {
  state.isUpdatePending = false;
  mockReloadAsync.mockClear();
});

describe('UpdateBanner', () => {
  // Rien à proposer tant que rien n'est téléchargé : la bannière n'existe pas.
  it('reste absente sans mise à jour en attente', () => {
    const { queryByTestId } = render(<UpdateBanner />);
    expect(queryByTestId('update-banner')).toBeNull();
  });

  it('propose le rechargement une fois la mise à jour prête', () => {
    state.isUpdatePending = true;
    const { getByTestId, getByText } = render(<UpdateBanner />);
    expect(getByTestId('update-banner')).toBeTruthy();
    expect(getByText('Mise à jour prête')).toBeTruthy();
  });

  it('recharge l’application au clic sur Relancer', () => {
    state.isUpdatePending = true;
    const { getByText } = render(<UpdateBanner />);
    fireEvent.press(getByText('Relancer'));
    expect(mockReloadAsync).toHaveBeenCalledTimes(1);
  });

  // C'est une proposition : la croix la fait taire, la mise à jour reste sur
  // l'appareil et s'appliquera au prochain démarrage.
  it('disparaît quand on la refuse', () => {
    state.isUpdatePending = true;
    const { getByLabelText, queryByTestId } = render(<UpdateBanner />);
    fireEvent.press(getByLabelText('Ignorer la mise à jour'));
    expect(queryByTestId('update-banner')).toBeNull();
  });
});
