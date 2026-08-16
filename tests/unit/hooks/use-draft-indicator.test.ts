import { useDraftCount } from '@/hooks/use-draft-indicator';
import { clearAllDrafts, saveDraft } from '@/storage/report-draft';
import { renderHook, waitFor } from '@testing-library/react-native';

// `useFocusEffect` attend un navigateur autour du composant. Ici on ne teste pas
// la navigation mais ce qui se produit à l'arrivée sur l'écran : on le réduit
// donc à un effet ordinaire.
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (effect: () => (() => void) | void) => require('react').useEffect(effect, [effect]),
}));

const draft = {
  latitude: 45.75,
  longitude: 4.85,
  addressQuery: '12 rue Victor-Hugo',
  description: 'Nid-de-poule',
  type: 'Road' as const,
  photos: [],
};

beforeEach(() => clearAllDrafts());

describe('useDraftCount', () => {
  it('ne signale rien sans brouillon', async () => {
    const { result } = renderHook(() => useDraftCount());
    await waitFor(() => expect(result.current).toBe(0));
  });

  // C'est tout l'objet de la pastille : le brouillon se restaure tout seul, mais
  // rien ne le disait avant d'ouvrir le formulaire.
  it('signale un brouillon en attente', async () => {
    await saveDraft(draft);
    const { result } = renderHook(() => useDraftCount());
    await waitFor(() => expect(result.current).toBe(1));
  });

  // Trois brouillons en attente ne se racontent pas comme un seul.
  it('compte les brouillons', async () => {
    await saveDraft({ ...draft, description: 'Premier' });
    await saveDraft({ ...draft, description: 'Second' });
    const { result } = renderHook(() => useDraftCount());
    await waitFor(() => expect(result.current).toBe(2));
  });

  it('ne signale plus rien une fois les brouillons effacés', async () => {
    await saveDraft(draft);
    await clearAllDrafts();
    const { result } = renderHook(() => useDraftCount());
    await waitFor(() => expect(result.current).toBe(0));
  });
});
