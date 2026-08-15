jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('expo-blur', () => ({ BlurView: 'BlurView' }));

import { MapNotice } from '@/components/explore/MapNotice';
import { fireEvent, render } from '@testing-library/react-native';

describe('MapNotice', () => {
  // Une panne réseau et une zone réellement vide donnaient exactement le même
  // écran : une carte nue. Ces trois états doivent rester distincts.
  it('distingue la panne réseau', () => {
    const { getByText } = render(<MapNotice kind="offline" top={0} />);
    expect(getByText('Données indisponibles')).toBeTruthy();
  });

  it('distingue l’absence de signalement', () => {
    const { getByText } = render(<MapNotice kind="empty" top={0} />);
    expect(getByText('Aucun signalement')).toBeTruthy();
  });

  it('distingue un filtre sans résultat', () => {
    const { getByText } = render(<MapNotice kind="filtered" top={0} />);
    expect(getByText('Aucun résultat')).toBeTruthy();
  });

  it('propose de réessayer quand on le lui demande', () => {
    const onRetry = jest.fn();
    const { getByText } = render(<MapNotice kind="offline" top={0} onRetry={onRetry} />);
    fireEvent.press(getByText('Réessayer'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  // Relancer un filtre qui ne renvoie rien ne changerait rien.
  it('n’offre pas de réessayer sur un état vide', () => {
    const { queryByText } = render(<MapNotice kind="filtered" top={0} />);
    expect(queryByText('Réessayer')).toBeNull();
  });
});
