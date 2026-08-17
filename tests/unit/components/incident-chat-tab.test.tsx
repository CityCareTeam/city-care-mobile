import { IncidentChatTab } from '@/components/explore/IncidentChatTab';
import { getStrings } from '@/constants/i18n';
import type { MessageResponse } from '@/types/messages';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const t = getStrings();

const MINE: MessageResponse = {
  id: 'm-mine',
  incident_id: 'i1',
  author_user_id: 'moi',
  author_role: 'Citizen',
  author_name: 'Moi',
  content: 'Message de moi',
  created_at: '2026-08-01T10:00:00+02:00',
};

const THEIRS: MessageResponse = {
  ...MINE,
  id: 'm-theirs',
  author_user_id: 'quelquun',
  author_name: 'Quelqu’un',
  content: 'Message d’un autre',
};

const BASE = {
  loading: false,
  connected: true,
  sending: false,
  dbUserId: 'moi',
  onSend: () => Promise.resolve(),
};

describe('IncidentChatTab — signalement d’un message', () => {
  /**
   * Le défaut que ce test verrouille : la modale de signalement existait, était
   * câblée à sa soumission, et rien ne l'ouvrait. Un composant qu'aucun bouton
   * n'atteint est une fonctionnalité absente — et rien ne s'en plaignait, parce
   * que le code compilait.
   */
  it('offre un drapeau sur le message d’un autre', () => {
    const onFlag = jest.fn();
    render(<IncidentChatTab {...BASE} messages={[THEIRS]} onFlag={onFlag} />);

    fireEvent.press(screen.getByLabelText(t.moderation.flagTitle));
    expect(onFlag).toHaveBeenCalledWith('m-theirs');
  });

  // Se signaler soi-même n'a pas de sens : on peut déjà s'abstenir d'écrire.
  it('n’en offre pas sur ses propres messages', () => {
    render(<IncidentChatTab {...BASE} messages={[MINE]} onFlag={jest.fn()} />);
    expect(screen.queryByLabelText(t.moderation.flagTitle)).toBeNull();
  });

  // Sans le rappel, pas d'affordance : l'écran qui n'offre pas la modération ne
  // doit pas montrer un drapeau qui ne fait rien.
  it('reste muet quand la modération n’est pas offerte', () => {
    render(<IncidentChatTab {...BASE} messages={[THEIRS]} />);
    expect(screen.queryByLabelText(t.moderation.flagTitle)).toBeNull();
  });

  it('affiche quand même les messages', () => {
    render(<IncidentChatTab {...BASE} messages={[MINE, THEIRS]} onFlag={jest.fn()} />);
    expect(screen.getByText('Message de moi')).toBeTruthy();
    expect(screen.getByText('Message d’un autre')).toBeTruthy();
  });
});
