import { Text } from '@/components/ui/AppText';
import type { TextScale } from '@/storage/preferences';
import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

const mockScale = jest.fn<TextScale, []>();
jest.mock('@/context/PreferencesContext', () => ({
  usePreferences: () => ({ textScale: mockScale() }),
}));

/** La taille effectivement rendue, tous styles aplatis. */
function renderedStyle(testID: string) {
  return StyleSheet.flatten(screen.getByTestId(testID).props.style) as {
    fontSize?: number;
    lineHeight?: number;
    color?: string;
  };
}

beforeEach(() => mockScale.mockReturnValue('system'));

describe('AppText — échelle de texte', () => {
  /**
   * `system` ne fait rien de plus : le réglage d'accessibilité d'Android
   * s'applique déjà à toute l'application, et doit rester la référence. Le style
   * passe donc tel quel, sans même une allocation.
   */
  it('laisse le style intact sur « Système »', () => {
    render(<Text testID="t" style={{ fontSize: 14 }} />);
    expect(renderedStyle('t').fontSize).toBe(14);
  });

  it('agrandit sur les autres crans', () => {
    mockScale.mockReturnValue('large');
    render(<Text testID="t" style={{ fontSize: 14 }} />);
    expect(renderedStyle('t').fontSize).toBeCloseTo(16.1);
  });

  /**
   * `lineHeight` grossit du même facteur quand elle est fixée : la laisser
   * derrière ferait se chevaucher les lignes d'un paragraphe agrandi.
   */
  it('emmène la hauteur de ligne avec la taille', () => {
    mockScale.mockReturnValue('larger');
    render(<Text testID="t" style={{ fontSize: 10, lineHeight: 20 }} />);

    const style = renderedStyle('t');
    expect(style.fontSize).toBeCloseTo(13);
    expect(style.lineHeight).toBeCloseTo(26);
  });

  /**
   * Sans `fontSize`, un texte resterait à sa taille d'origine pendant que ses
   * voisins grossissent — et l'écran perdrait sa hiérarchie au lieu de la garder.
   */
  it('part de la taille par défaut quand aucune n’est fixée', () => {
    mockScale.mockReturnValue('large');
    render(<Text testID="t" />);
    expect(renderedStyle('t').fontSize).toBeCloseTo(16.1);
  });

  /**
   * `allowFontScaling={false}` vaut aussi pour nous : c'est ce que demandent les
   * étiquettes des épingles de la carte, dessinées dans une forme de taille fixe.
   * Un composant qui refuse l'échelle du système n'a pas de raison d'accepter la
   * nôtre.
   */
  it('respecte le refus de mise à l’échelle', () => {
    mockScale.mockReturnValue('larger');
    render(<Text testID="t" allowFontScaling={false} style={{ fontSize: 11 }} />);
    expect(renderedStyle('t').fontSize).toBe(11);
  });

  // Le reste du style ne doit pas se perdre en route.
  it('conserve les autres propriétés', () => {
    mockScale.mockReturnValue('large');
    render(<Text testID="t" style={{ fontSize: 12, color: '#ff0000' }} />);
    expect(renderedStyle('t').color).toBe('#ff0000');
  });
});
