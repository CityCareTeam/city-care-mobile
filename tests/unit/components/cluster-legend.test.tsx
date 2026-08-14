jest.mock('expo-blur', () => ({ BlurView: 'BlurView' }));

import { ClusterLegend } from '@/components/explore/ClusterLegend';
import { CLUSTER_DENSITY } from '@/constants/incidents';
import { render } from '@testing-library/react-native';

const [DENSE, WARM] = CLUSTER_DENSITY;

describe('ClusterLegend', () => {
  // Elle expliquait une couleur absente de l'écran : avec seize signalements,
  // aucune pastille n'atteint jamais le seuil, et la légende s'affichait quand
  // même.
  it('ne s’affiche pas quand aucun palier n’est atteint', () => {
    const { toJSON } = render(<ClusterLegend tiers={[]} bottom={0} />);
    expect(toJSON()).toBeNull();
  });

  it('ne liste que les paliers réellement présents', () => {
    const { getByText, queryByText } = render(<ClusterLegend tiers={[WARM]} bottom={0} />);
    expect(getByText(WARM.label)).toBeTruthy();
    expect(queryByText(DENSE.label)).toBeNull();
  });

  it('affiche les deux paliers du moins dense au plus dense', () => {
    const { getByText } = render(<ClusterLegend tiers={CLUSTER_DENSITY} bottom={0} />);
    expect(getByText(WARM.label)).toBeTruthy();
    expect(getByText(DENSE.label)).toBeTruthy();
  });
});
