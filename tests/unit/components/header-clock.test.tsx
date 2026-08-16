import { HeaderClock } from '@/components/ui/HeaderClock';
import { act, render } from '@testing-library/react-native';

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

function at(hour: number, minute: number, second = 0) {
  jest.setSystemTime(new Date(2026, 7, 16, hour, minute, second));
}

describe('HeaderClock', () => {
  it('affiche l’heure sur deux chiffres', () => {
    at(9, 5);
    expect(render(<HeaderClock />).getByLabelText('09 heures 05')).toBeTruthy();
  });

  // Le point de tout le composant : un intervalle d'une minute lancé à
  // 10 h 30 min 40 s afficherait 10:31 à 10 h 31 min 40 s — quarante secondes de
  // retard, définitivement. On vise la seconde 0 suivante.
  it('se cale sur la minute pleine, pas sur soixante secondes', () => {
    at(10, 30, 40);
    const { getByLabelText } = render(<HeaderClock />);
    expect(getByLabelText('10 heures 30')).toBeTruthy();

    // Vingt secondes plus tard : la minute vient de tourner. Avancer les
    // minuteurs avance aussi l'horloge — inutile de la repositionner.
    act(() => jest.advanceTimersByTime(20_000));
    expect(getByLabelText('10 heures 31')).toBeTruthy();
  });

  it('continue de battre chaque minute ensuite', () => {
    at(10, 30, 40);
    const { getByLabelText } = render(<HeaderClock />);

    act(() => jest.advanceTimersByTime(20_000));
    act(() => jest.advanceTimersByTime(60_000));
    expect(getByLabelText('10 heures 32')).toBeTruthy();
  });

  it('se décrit aux lecteurs d’écran', () => {
    at(14, 7);
    expect(render(<HeaderClock />).getByLabelText('14 heures 07')).toBeTruthy();
  });
});
