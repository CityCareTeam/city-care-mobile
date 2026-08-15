jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');

import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { fireEvent, render } from '@testing-library/react-native';

describe('ErrorNotice', () => {
  it('affiche le détail de l’échec', () => {
    const { getByText } = render(<ErrorNotice detail="Serveur injoignable." />);
    expect(getByText('Chargement impossible')).toBeTruthy();
    expect(getByText('Serveur injoignable.')).toBeTruthy();
  });

  it('accepte un titre sur mesure', () => {
    const { getByText } = render(<ErrorNotice title="Hors ligne" detail="…" />);
    expect(getByText('Hors ligne')).toBeTruthy();
  });

  // Sans issue proposée, l'utilisateur n'a d'autre recours que de quitter l'écran.
  it('déclenche la nouvelle tentative', () => {
    const onRetry = jest.fn();
    const { getByText } = render(<ErrorNotice detail="…" onRetry={onRetry} />);
    fireEvent.press(getByText('Réessayer'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('n’affiche aucun bouton quand réessayer n’aurait pas de sens', () => {
    const { queryByText } = render(<ErrorNotice detail="…" />);
    expect(queryByText('Réessayer')).toBeNull();
  });
});
