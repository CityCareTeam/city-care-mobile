import { render } from '@testing-library/react-native';
import { CLUSTER_PIN_ANCHOR, ClusterPin, MAP_PIN_ANCHOR, MapPin } from '@/components/ui/MapPin';
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');



/**
 * Au-delà d'une cinquantaine de pixels de hauteur, le bitmap du marker Android
 * cesse de suivre la vue et la forme est rognée : mesuré sur émulateur, un
 * conteneur 40×49 rend une larme complète, 46×56 en perd la pointe. Ce plafond
 * n'est pas déductible du code — d'où ce test, qui échoue si une évolution du
 * style repasse au-dessus.
 */
const MAX_MARKER_HEIGHT = 52;

function rootStyle(tree: any) {
  const s = tree.props?.style;
  return Array.isArray(s) ? Object.assign({}, ...s.filter(Boolean)) : s;
}

describe('marqueurs de carte', () => {
  const markers: [string, () => any][] = [
    ['MapPin au repos', () => render(<MapPin color="#2196f3" type="Road" />).toJSON()],
    ['MapPin sélectionnée', () => render(<MapPin color="#2196f3" type="Road" active />).toJSON()],
    ['ClusterPin 2', () => render(<ClusterPin count={2} color="#f0a500" />).toJSON()],
    ['ClusterPin 10', () => render(<ClusterPin count={10} color="#2196f3" />).toJSON()],
    ['ClusterPin 147', () => render(<ClusterPin count={147} color="#4caf50" />).toJSON()],
    ['ClusterPin 1200', () => render(<ClusterPin count={1200} color="#4caf50" />).toJSON()],
  ];

  it.each(markers)('%s tient sous le plafond de rasterisation', (_name, build) => {
    const { width, height } = rootStyle(build());
    expect(height).toBeLessThanOrEqual(MAX_MARKER_HEIGHT);
    expect(width).toBeLessThanOrEqual(MAX_MARKER_HEIGHT);
  });

  it('les pastilles gardent une taille unique quel que soit le compteur', () => {
    const sizes = [1, 9, 10, 99, 100, 999, 5000].map((count) => {
      const { width, height } = rootStyle(render(<ClusterPin count={count} color="#f0a500" />).toJSON());
      return `${width}x${height}`;
    });
    expect(new Set(sizes).size).toBe(1);
  });

  // Si l'ancre valait 1, la coordonnée tomberait sous la pointe, sur la marge
  // laissée pour que la rasterisation ne la mange pas.
  it.each([
    ['épingle au repos', MAP_PIN_ANCHOR.rest],
    ['épingle sélectionnée', MAP_PIN_ANCHOR.active],
    ['pastille', CLUSTER_PIN_ANCHOR],
  ])('ancre %s sur la pointe, pas sur le bas du conteneur', (_name, anchor) => {
    expect(anchor.x).toBe(0.5);
    expect(anchor.y).toBeGreaterThan(0.85);
    expect(anchor.y).toBeLessThan(1);
  });

  it('plafonne le compteur affiché à 999+', () => {
    const { getByText } = render(<ClusterPin count={4321} color="#f0a500" />);
    expect(getByText('999+')).toBeTruthy();
  });
});
