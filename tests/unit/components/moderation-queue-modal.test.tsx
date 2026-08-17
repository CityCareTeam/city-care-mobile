import { ModerationQueueModal } from '@/components/moderation/ModerationQueueModal';
import { getStrings } from '@/constants/i18n';
import type { FlaggedContent, HiddenContent } from '@/services/moderation';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/storage/tokens', () => ({ getValidToken: () => Promise.resolve('jeton') }));

// Préfixés `mock` : jest interdit à une fabrique de mock de refermer sur une
// variable ordinaire, cette convention est la seule exception admise.
const mockQueue = jest.fn();
const mockHidden = jest.fn();
const mockRestore = jest.fn();
const mockDelete = jest.fn();
jest.mock('@/services/moderation', () => ({
  ...jest.requireActual('@/services/moderation'),
  getModerationQueue: (...args: unknown[]) => mockQueue(...args),
  getHiddenContent: (...args: unknown[]) => mockHidden(...args),
  restoreContent: (...args: unknown[]) => mockRestore(...args),
  deleteHiddenContent: (...args: unknown[]) => mockDelete(...args),
  decideOnFlag: () => Promise.resolve(),
}));

const t = getStrings();

const ON_INCIDENT: FlaggedContent = {
  id: 'g1',
  targetType: 'incident',
  targetId: 'inc-1',
  incidentId: 'inc-1',
  reason: 'hateful',
  count: 2,
  excerpt: 'Texte litigieux',
  firstFlaggedAt: '2026-08-01T10:00:00+02:00',
};

const ON_MESSAGE: FlaggedContent = {
  ...ON_INCIDENT,
  id: 'g2',
  targetType: 'message',
  targetId: 'msg-1',
  incidentId: 'inc-9',
  count: 1,
};

const MASQUE: HiddenContent = {
  targetType: 'incident',
  targetId: 'inc-7',
  incidentId: 'inc-7',
  excerpt: 'Contenu retiré de la vue',
  visibility: 'hidden',
  reason: 'advertising',
  flagCount: 3,
  decidedAt: '2026-08-02T09:00:00+02:00',
  decidedBy: 'Agent Dupont',
  decisionComment: 'publicité déguisée',
};

beforeEach(() => {
  mockQueue.mockReset().mockResolvedValue([]);
  mockHidden.mockReset().mockResolvedValue([]);
  mockRestore.mockReset().mockResolvedValue(undefined);
  mockDelete.mockReset().mockResolvedValue(undefined);
});

describe('ModerationQueueModal — ouvrir le contenu concerné', () => {
  /**
   * Le manque que ce test verrouille : la file montrait un extrait de quatre
   * lignes et rien pour aller voir le reste. Le cas franc se tranche sur
   * l'extrait, le cas douteux demande le contexte.
   */
  it('renvoie sur la fiche pour un signalement', async () => {
    mockQueue.mockResolvedValue([ON_INCIDENT]);
    const onOpenContent = jest.fn();
    render(<ModerationQueueModal visible onClose={() => {}} onOpenContent={onOpenContent} />);

    fireEvent.press(await screen.findByLabelText(t.moderation.openContent));
    expect(onOpenContent).toHaveBeenCalledWith('inc-1', false);
  });

  // Un message signalé n'apparaît pas sur la fiche : il faut ouvrir le fil, sinon
  // le modérateur atterrit sur un écran où le contenu jugé est absent.
  it('renvoie sur le fil pour un message', async () => {
    mockQueue.mockResolvedValue([ON_MESSAGE]);
    const onOpenContent = jest.fn();
    render(<ModerationQueueModal visible onClose={() => {}} onOpenContent={onOpenContent} />);

    fireEvent.press(await screen.findByLabelText(t.moderation.openContent));
    expect(onOpenContent).toHaveBeenCalledWith('inc-9', true);
  });

  // Contenu supprimé entre-temps : l'entrée reste pour être close, mais un bouton
  // qui ne mène nulle part vaut moins que pas de bouton.
  it('n’offre rien à ouvrir quand le contenu a disparu', async () => {
    mockQueue.mockResolvedValue([{ ...ON_INCIDENT, incidentId: null, excerpt: '' }]);
    render(<ModerationQueueModal visible onClose={() => {}} onOpenContent={jest.fn()} />);

    await screen.findByText(t.moderation.noExcerpt);
    expect(screen.queryByLabelText(t.moderation.openContent)).toBeNull();
  });

  // Sans le rappel, pas d'affordance — l'écran qui n'offre pas la navigation ne
  // doit pas montrer un lien inerte.
  it('reste muet sans rappel de navigation', async () => {
    mockQueue.mockResolvedValue([ON_INCIDENT]);
    render(<ModerationQueueModal visible onClose={() => {}} />);

    await screen.findByText('Texte litigieux');
    expect(screen.queryByLabelText(t.moderation.openContent)).toBeNull();
  });

  // Le plus signalé d'abord : dix personnes qui signalent la même chose ont plus
  // urgemment raison qu'une seule.
  it('classe le plus signalé en tête', async () => {
    mockQueue.mockResolvedValue([ON_MESSAGE, ON_INCIDENT]);
    render(<ModerationQueueModal visible onClose={() => {}} onOpenContent={jest.fn()} />);

    await waitFor(() => expect(screen.getAllByLabelText(t.moderation.openContent)).toHaveLength(2));
    const kinds = screen.getAllByText(
      new RegExp(`${t.moderation.onIncident}|${t.moderation.onMessage}`, 'i'),
    );
    expect(kinds[0].props.children).toBe(t.moderation.onIncident);
  });
});

describe('ModerationQueueModal — contenus masqués', () => {
  /**
   * Le cul-de-sac que ces tests verrouillent : masquer retirait le contenu de
   * toutes les lectures *et* de la file. Plus rien ne permettait de revenir
   * dessus depuis l'application — une décision qu'on ne peut pas revoir est une
   * décision qu'on n'ose pas prendre.
   */
  async function openHiddenTab(props: Partial<React.ComponentProps<typeof ModerationQueueModal>> = {}) {
    mockHidden.mockResolvedValue([MASQUE]);
    render(<ModerationQueueModal visible onClose={() => {}} {...props} />);
    fireEvent.press(await screen.findByText(t.moderation.tabHidden));
  }

  it('montre le contenu masqué, qui l’a masqué et pourquoi', async () => {
    await openHiddenTab();

    expect(await screen.findByText('Contenu retiré de la vue')).toBeTruthy();
    expect(screen.getByText(t.moderation.hiddenBy('Agent Dupont'))).toBeTruthy();
    expect(screen.getByText('« publicité déguisée »')).toBeTruthy();
  });

  it('rend un contenu visible', async () => {
    await openHiddenTab();

    fireEvent.press(await screen.findByText(t.moderation.restore));
    await waitFor(() => expect(mockRestore).toHaveBeenCalledWith('incident', 'inc-7', 'jeton'));
    // Retiré de la liste sur place : attendre un rechargement ferait douter que
    // l'appui ait porté.
    await waitFor(() => expect(screen.queryByText('Contenu retiré de la vue')).toBeNull());
  });

  // Un agent masque — geste réversible — un administrateur efface. Le serveur le
  // refuse aussi ; ne pas montrer le bouton évite d'offrir un refus.
  it('n’offre la suppression qu’aux administrateurs', async () => {
    await openHiddenTab();
    expect(screen.queryByText(t.moderation.deleteShort)).toBeNull();
  });

  it('offre la suppression quand le droit est là', async () => {
    await openHiddenTab({ canDelete: true });
    expect(await screen.findByText(t.moderation.deleteShort)).toBeTruthy();
  });

  // La pastille compte des affaires à traiter, pas des contenus masqués : ceux-là
  // sont réglés et n'appellent plus de décision.
  it('remonte le nombre d’affaires en attente, masqués exclus', async () => {
    const onCountChange = jest.fn();
    mockQueue.mockResolvedValue([ON_INCIDENT, ON_MESSAGE]);
    mockHidden.mockResolvedValue([MASQUE]);
    render(<ModerationQueueModal visible onClose={() => {}} onCountChange={onCountChange} />);

    await waitFor(() => expect(onCountChange).toHaveBeenCalledWith(2));
  });
});
