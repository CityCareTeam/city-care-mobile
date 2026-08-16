import { useAppRefreshControl } from '@/components/ui/AppRefreshControl';
import { CityCareColors, CityCareColorsDark } from '@/constants/theme';
import { renderHook } from '@testing-library/react-native';
import { RefreshControl } from 'react-native';

let mockScheme: 'light' | 'dark' = 'light';
jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: () => mockScheme }));

beforeEach(() => { mockScheme = 'light'; });

function control(offset?: number) {
  const { result } = renderHook(() =>
    useAppRefreshControl({ refreshing: false, onRefresh: () => {}, offset }),
  );
  return result.current;
}

describe('useAppRefreshControl', () => {
  // La régression qui a noirci deux écrans : `ScrollView` ne rend pas l'élément
  // qu'on lui donne, il le *clone* en lui passant tout le contenu de l'écran
  // comme enfants. Un composant intermédiaire recevait donc ces enfants et les
  // jetait. Il faut un vrai `RefreshControl`, et rien d'autre.
  it('rend un RefreshControl, pas un composant intermédiaire', () => {
    expect(control().type).toBe(RefreshControl);
  });

  // C'était le défaut d'origine : les écrans ne passaient que `tintColor`, qui
  // n'existe que sur iOS. Sur Android la pastille tournait dans le bleu système.
  it('donne à Android la couleur de la marque', () => {
    expect(control().props.colors).toEqual([CityCareColors.primary]);
  });

  it('garde `tintColor` pour iOS', () => {
    expect(control().props.tintColor).toBe(CityCareColors.primary);
  });

  // En sombre, le blanc du système faisait une lune dans un ciel noir.
  it('pose la pastille sur la surface du thème sombre', () => {
    mockScheme = 'dark';
    expect(control().props.progressBackgroundColor).toBe(CityCareColorsDark.white);
  });

  // Sans décalage, la pastille apparaît sous la barre d'état, à moitié coupée.
  it('descend la pastille sous la barre d’état', () => {
    expect(control(48).props.progressViewOffset).toBe(48);
  });

  it('ne décale rien par défaut', () => {
    expect(control().props.progressViewOffset).toBe(0);
  });
});
