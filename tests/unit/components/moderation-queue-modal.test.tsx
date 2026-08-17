import { ModerationQueueModal } from '@/components/moderation/ModerationQueueModal';
import { getStrings } from '@/constants/i18n';
import type { FlaggedContent } from '@/services/moderation';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/storage/tokens', () => ({ getValidToken: () => Promise.resolve('jeton') }));

// Préfixé `mock` : jest interdit à une fabrique de mock de refermer sur une
// variable ordinaire, cette convention est la seule exception admise.
const mockQueue = jest.fn();
jest.mock('@/services/moderation', () => ({
  ...jest.requireActual('@/services/moderation'),
  getModerationQueue: (...args: unknown[]) => mockQueue(...args),
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

beforeEach(() => mockQueue.mockReset());

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
