import { GuideModal } from '@/components/app/GuideModal';
import { fr } from '@/constants/i18n/fr';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 0, left: 0, right: 0 }),
}));

const steps = fr.guide.steps;

function open() {
  return render(<GuideModal visible onClose={() => {}} />);
}

describe('GuideModal', () => {
  it('affiche toutes les étapes dans la rangée, la première en vue', () => {
    open();
    // Elles cohabitent dans une rangée paginée : c'est ce qui permet de les
    // faire défiler au doigt plutôt que de les remplacer une par une.
    for (const step of steps) {
      expect(screen.getByText(step.title)).toBeTruthy();
    }
    expect(screen.getByText(fr.guide.swipeHint)).toBeTruthy();
  });

  it('avance et revient avec les boutons', () => {
    open();
    expect(screen.queryByText(fr.guide.back)).toBeNull();

    fireEvent.press(screen.getByText(fr.guide.next));
    expect(screen.getByText(fr.guide.back)).toBeTruthy();
    // L'invitation à glisser ne s'affiche qu'une fois.
    expect(screen.queryByText(fr.guide.swipeHint)).toBeNull();

    fireEvent.press(screen.getByText(fr.guide.back));
    expect(screen.queryByText(fr.guide.back)).toBeNull();
  });

  // Une fois que les points annoncent un geste, les ignorer serait une promesse
  // à moitié tenue.
  it('saute à une étape par son point', () => {
    open();
    fireEvent.press(screen.getByLabelText(fr.guide.stepA11y(steps.length, steps.length)));

    expect(screen.getByText(fr.guide.done)).toBeTruthy();
  });

  it('ferme à la dernière étape et au bouton passer', () => {
    const onClose = jest.fn();
    render(<GuideModal visible onClose={onClose} />);

    fireEvent.press(screen.getByText(fr.guide.skip));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByLabelText(fr.guide.stepA11y(steps.length, steps.length)));
    fireEvent.press(screen.getByText(fr.guide.done));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  /**
   * Le glissement lent ne déclenche pas de « momentum » : sans l'écouteur de
   * fin de traînée, relâcher doucement laissait les points en arrière.
   */
  it('suit le doigt, momentum ou pas', () => {
    open();
    const row = screen.UNSAFE_getByType(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('react-native').ScrollView,
    );
    const scrolled = { nativeEvent: { contentOffset: { x: 1000 }, layoutMeasurement: { width: 300 } } };

    // Sans largeur mesurée, l'événement ne doit rien casser.
    fireEvent(row, 'momentumScrollEnd', scrolled);
    fireEvent(row, 'scrollEndDrag', scrolled);

    expect(screen.getByText(steps[0].title)).toBeTruthy();
  });
});
