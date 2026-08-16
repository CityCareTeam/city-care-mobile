import { AppRefreshControl } from '@/components/ui/AppRefreshControl';
import { CityCareColors, CityCareColorsDark } from '@/constants/theme';
import { render } from '@testing-library/react-native';

let mockScheme: 'light' | 'dark' = 'light';
jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: () => mockScheme }));

beforeEach(() => { mockScheme = 'light'; });

function renderControl(props: Partial<React.ComponentProps<typeof AppRefreshControl>> = {}) {
  return render(
    <AppRefreshControl refreshing={false} onRefresh={() => {}} {...props} />,
  );
}

describe('AppRefreshControl', () => {
  // C'était le défaut : les écrans ne passaient que `tintColor`, qui n'existe
  // que sur iOS. Sur Android la pastille tournait dans le bleu du système.
  it('donne à Android la couleur de la marque', () => {
    const { UNSAFE_root } = renderControl();
    const control = UNSAFE_root.findByType(AppRefreshControl);
    const rendered = control.children[0] as { props: Record<string, unknown> };
    expect(rendered.props.colors).toEqual([CityCareColors.primary]);
  });

  it('garde `tintColor` pour iOS', () => {
    const { UNSAFE_root } = renderControl();
    const rendered = UNSAFE_root.findByType(AppRefreshControl).children[0] as {
      props: Record<string, unknown>;
    };
    expect(rendered.props.tintColor).toBe(CityCareColors.primary);
  });

  // En sombre, le blanc du système faisait une lune dans un ciel noir.
  it('pose la pastille sur la surface du thème sombre', () => {
    mockScheme = 'dark';
    const { UNSAFE_root } = renderControl();
    const rendered = UNSAFE_root.findByType(AppRefreshControl).children[0] as {
      props: Record<string, unknown>;
    };
    expect(rendered.props.progressBackgroundColor).toBe(CityCareColorsDark.white);
  });

  // Sans décalage, la pastille apparaît sous la barre d'état, à moitié coupée.
  it('descend la pastille sous la barre d’état', () => {
    const { UNSAFE_root } = renderControl({ offset: 48 });
    const rendered = UNSAFE_root.findByType(AppRefreshControl).children[0] as {
      props: Record<string, unknown>;
    };
    expect(rendered.props.progressViewOffset).toBe(48);
  });

  it('ne décale rien par défaut', () => {
    const { UNSAFE_root } = renderControl();
    const rendered = UNSAFE_root.findByType(AppRefreshControl).children[0] as {
      props: Record<string, unknown>;
    };
    expect(rendered.props.progressViewOffset).toBe(0);
  });
});
