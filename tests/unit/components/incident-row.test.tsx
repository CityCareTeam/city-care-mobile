import { IncidentRow } from '@/components/incident-row';
import { STATUS_LABEL, TYPE_LABEL } from '@/constants/incidents';
import { getStrings } from '@/constants/i18n';
import { fireEvent, render, screen } from '@testing-library/react-native';

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
   * Le titre est ce qui distingue une ligne de sa voisine. C'était la catégorie
   * — dix lignes de suite intitulées pareil, sous dix icônes qui le disaient
   * déjà — et la description passait en italique tronqué.
   */
  it('met la description en titre, la catégorie en second', () => {
    render(<IncidentRow {...BASE} description="Nid-de-poule devant le 12" />);

    expect(screen.getByText('Nid-de-poule devant le 12')).toBeTruthy();
    expect(screen.getByText(`${TYPE_LABEL.Road} · Lyon`)).toBeTruthy();
  });

  // Sans description, mieux vaut répéter la catégorie que laisser un titre vide.
  it('retombe sur la catégorie quand rien n’est écrit', () => {
    render(<IncidentRow {...BASE} description="   " />);
    expect(screen.getByText(TYPE_LABEL.Road)).toBeTruthy();
  });

  // « Localisation inconnue » occupait une ligne pour ne rien dire.
  it('tait la localisation plutôt que d’annoncer qu’elle l’ignore', () => {
    render(<IncidentRow {...BASE} address={null} />);
    expect(screen.queryByText(/inconnue/i)).toBeNull();
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

describe('IncidentRow — contenu masqué', () => {
  const t = getStrings();

  /**
   * Le manque que ces tests verrouillent : un signalement masqué par la
   * modération quittait toutes les lectures, y compris celle de son auteur. Il
   * disparaissait donc de sa liste sans un mot — ce qui se lit comme une perte
   * de données et non comme une décision.
   */
  it('annonce le masquage', () => {
    render(<IncidentRow {...BASE} hidden />);
    expect(screen.getByText(t.moderation.hiddenTag)).toBeTruthy();
  });

  /**
   * À la place du statut, pas au-dessus : masqué, le contenu n'avance plus dans
   * le traitement, et afficher les deux ferait croire qu'il suit son cours.
   */
  it('remplace le badge de statut au lieu de s’y ajouter', () => {
    render(<IncidentRow {...BASE} hidden />);
    expect(screen.queryByText(STATUS_LABEL.reported)).toBeNull();
  });

  it('garde le statut quand rien n’est masqué', () => {
    render(<IncidentRow {...BASE} />);
    expect(screen.getByText(STATUS_LABEL.reported)).toBeTruthy();
    expect(screen.queryByText(t.moderation.hiddenTag)).toBeNull();
  });

  // La ligne reste ouvrable : le serveur sert la fiche à son auteur, et c'est là
  // qu'il lit pourquoi elle a été retirée.
  it('reste ouvrable', () => {
    const onPress = jest.fn();
    render(<IncidentRow {...BASE} hidden onPress={onPress} />);
    fireEvent.press(screen.getByLabelText(new RegExp(t.moderation.hiddenTag)));
    expect(onPress).toHaveBeenCalledWith('1');
  });
});

describe('IncidentRow — badge « le mien »', () => {
  const t = getStrings();

  /**
   * Le défaut que ce test verrouille : `IncidentList` recevait `isMine` pour
   * toute une liste et ne le transmettait jamais aux lignes — seul l'ensemble
   * `myIds` était consulté. Le badge manquait donc partout où la liste était le
   * seul indice, quel que soit le tri.
   */
  it('se voit quand la ligne est à soi', () => {
    render(<IncidentRow {...BASE} isMine />);
    expect(screen.getByText(t.incident.mine)).toBeTruthy();
  });

  it('reste absent sinon', () => {
    render(<IncidentRow {...BASE} />);
    expect(screen.queryByText(t.incident.mine)).toBeNull();
  });

  // Masqué, le contenu ne porte plus que cet état : « le mien » sur une ligne
  // rouge ajouterait un badge sans rien apprendre.
  it('cède la place au masquage', () => {
    render(<IncidentRow {...BASE} isMine hidden />);
    expect(screen.queryByText(t.incident.mine)).toBeNull();
    expect(screen.getByText(t.moderation.hiddenTag)).toBeTruthy();
  });
});
