import { IncidentRow } from '@/components/incident-row';
import { render, screen } from '@testing-library/react-native';

const BASE = {
  id: '1',
  type: 'Road',
  status: 'reported',
  address: '12 rue Garibaldi, 69003 Lyon',
  createdAt: '2026-08-01T10:00:00+02:00',
  onPress: () => {},
};

describe('IncidentRow', () => {
  it('montre la commune extraite de l’adresse', () => {
    render(<IncidentRow {...BASE} />);
    expect(screen.getByText('Lyon')).toBeTruthy();
  });

  /**
   * Le défaut que ce test verrouille : la distance était calculée par l'écran
   * d'accueil, puis perdue en route faute d'être transmise à la ligne. Rien ne
   * s'en plaignait — ni le compilateur, la propriété étant facultative, ni
   * l'écran, qui affichait simplement la commune seule.
   */
  it('ajoute la distance à côté de la commune', () => {
    render(<IncidentRow {...BASE} distanceKm={1.24} />);
    expect(screen.getByText('Lyon · 1,2 km')).toBeTruthy();
  });

  /**
   * Sans adresse, `extractCity` rend « Localisation inconnue ». La distance s'y
   * ajoute quand même, et c'est utile : on ignore la rue, on sait la distance.
   */
  it('donne la distance même sans commune identifiée', () => {
    render(<IncidentRow {...BASE} address={null} distanceKm={0.35} />);
    expect(screen.getByText(/350 m$/)).toBeTruthy();
  });

  // Tant que la position est inconnue, la ligne ne dit rien de la distance.
  it('n’affiche rien sans distance', () => {
    render(<IncidentRow {...BASE} />);
    expect(screen.queryByText(/km|\bm\b/)).toBeNull();
  });
});
