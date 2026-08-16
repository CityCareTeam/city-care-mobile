jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');

import { makeRowStyles, NotificationRow } from '@/components/notifications/NotificationRow';
import { fr } from '@/constants/i18n/fr';
import { CityCareColors } from '@/constants/theme';
import { STATUS_LABEL } from '@/constants/incidents';
import type { NotificationResponse } from '@/types/notifications';
import { fireEvent, render } from '@testing-library/react-native';

const styles = makeRowStyles(CityCareColors);

const notification = (parts: Partial<NotificationResponse> = {}): NotificationResponse => ({
  id: 'n1',
  type: 'new_incident',
  title: 'Nouveau signalement',
  body: 'Voirie — 23 rue Paul Duvivier',
  is_read: false,
  incident_id: 'i1',
  created_at: new Date().toISOString(),
  ...parts,
} as NotificationResponse);

function renderRow(
  item: NotificationResponse,
  onPress = jest.fn(),
  onDelete = jest.fn(),
  onMarkRead = jest.fn(),
) {
  return {
    onPress,
    onDelete,
    onMarkRead,
    ...render(
      <NotificationRow
        item={item}
        styles={styles}
        strings={fr}
        onPress={onPress}
        onDelete={onDelete}
        onMarkRead={onMarkRead}
      />,
    ),
  };
}

describe('NotificationRow', () => {
  it('affiche le titre et le corps', () => {
    const { getByText } = renderRow(notification());
    expect(getByText('Nouveau signalement')).toBeTruthy();
    expect(getByText('Voirie — 23 rue Paul Duvivier')).toBeTruthy();
  });

  it('remonte l’appui avec la notification complète', () => {
    const item = notification();
    const { getByText, onPress } = renderRow(item);
    fireEvent.press(getByText('Nouveau signalement'));
    expect(onPress).toHaveBeenCalledWith(item);
  });

  // Le glissement déclenchait la suppression à l'ouverture : un geste
  // involontaire effaçait une notification sans confirmation, et le bouton
  // révélé n'était jamais atteignable.
  it('ne supprime pas au simple rendu de l’action de glissement', () => {
    const { onDelete } = renderRow(notification());
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('supprime uniquement sur appui du bouton révélé', () => {
    const { getByLabelText, onDelete } = renderRow(notification());
    fireEvent.press(getByLabelText('Supprimer la notification : Nouveau signalement'));
    expect(onDelete).toHaveBeenCalledWith('n1');
  });

  describe('badge de statut', () => {
    it('déduit le statut du texte du message', () => {
      const { getByText } = renderRow(notification({
        type: 'incident_status_changed',
        body: 'Votre signalement est maintenant Résolu.',
      }));
      expect(getByText(STATUS_LABEL.resolved)).toBeTruthy();
    });

    it('n’affiche aucun badge pour les autres types', () => {
      const { queryByText } = renderRow(notification({ type: 'new_message' }));
      expect(queryByText(STATUS_LABEL.resolved)).toBeNull();
      expect(queryByText(STATUS_LABEL.in_progress)).toBeNull();
    });
  });

  it('affiche le nombre de messages groupés', () => {
    const { getByText } = renderRow(notification({ type: 'new_message', message_count: 4 }));
    expect(getByText('4')).toBeTruthy();
  });

  it('masque le compteur pour un message isolé', () => {
    const { queryByText } = renderRow(notification({ type: 'new_message', message_count: 1 }));
    expect(queryByText('1')).toBeNull();
  });
});
