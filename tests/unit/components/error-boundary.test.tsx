import { ErrorBoundary } from '@/components/app/ErrorBoundary';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

// Préfixe `mock` obligatoire : jest hisse les `jest.mock` au-dessus des
// déclarations, et n'autorise leur fabrique à fermer que sur ces variables-là.
const mockCheck = jest.fn();
const mockReload = jest.fn();

jest.mock('@/hooks/use-app-update', () => ({
  checkAndFetchUpdate: () => mockCheck(),
}));
jest.mock('expo-updates', () => ({ reloadAsync: () => mockReload() }));

const checkAndFetchUpdate = mockCheck;
const reloadAsync = mockReload;

function Boom({ fail }: { fail: boolean }) {
  if (fail) throw new Error('type manquant sur incident');
  return <Text>Écran normal</Text>;
}

let silence: jest.SpyInstance;

beforeEach(() => {
  checkAndFetchUpdate.mockReset();
  // `reloadAsync` rend une promesse dans la vraie bibliothèque, et le code
  // s'accroche à son `.catch`.
  reloadAsync.mockReset().mockResolvedValue(undefined);
  // React journalise l'erreur attrapée, ce qui est normal : on tait le bruit
  // sans masquer les vrais échecs, restaurés après chaque test.
  silence = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => silence.mockRestore());

describe('ErrorBoundary', () => {
  it('laisse passer un rendu sain', () => {
    render(
      <ErrorBoundary>
        <Boom fail={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Écran normal')).toBeTruthy();
  });

  /**
   * Le cœur du garde-fou : sans lui, cette erreur démonte l'arbre entier et
   * l'application disparaît sans un mot.
   */
  it('affiche l’écran de secours au lieu de disparaître', () => {
    render(
      <ErrorBoundary>
        <Boom fail />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Quelque chose s’est cassé')).toBeTruthy();
    expect(screen.getByText('Réessayer')).toBeTruthy();
  });

  // Le message technique ne sert à rien à l'utilisateur, mais c'est tout ce
  // qu'on aura s'il pense à le recopier.
  it('montre le message d’origine', () => {
    render(
      <ErrorBoundary>
        <Boom fail />
      </ErrorBoundary>,
    );
    expect(screen.getByText('type manquant sur incident')).toBeTruthy();
  });

  it('remonte l’arbre quand on réessaie', () => {
    // Le drapeau vit hors du rendu : React rejoue le rendu fautif pour
    // constituer la pile de composants, et un composant qui se répare lui-même
    // au premier appel ne lèverait jamais.
    let broken = true;
    function Flaky() {
      if (broken) throw new Error('une fois');
      return <Text>Écran normal</Text>;
    }

    render(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Quelque chose s’est cassé')).toBeTruthy();

    broken = false;
    fireEvent.press(screen.getByText('Réessayer'));

    expect(screen.getByText('Écran normal')).toBeTruthy();
  });

  /**
   * La seule porte de sortie d'un bundle fautif : réessayer le rejouerait
   * indéfiniment, il faut pouvoir en télécharger un autre depuis cet écran.
   */
  it('télécharge et applique une version corrigée', async () => {
    checkAndFetchUpdate.mockResolvedValue('downloaded');
    render(
      <ErrorBoundary>
        <Boom fail />
      </ErrorBoundary>,
    );

    await act(async () => {
      fireEvent.press(screen.getByText('Chercher une version corrigée'));
    });

    expect(checkAndFetchUpdate).toHaveBeenCalled();
    expect(reloadAsync).toHaveBeenCalled();
  });

  it('le dit quand il n’y a rien de plus récent', async () => {
    checkAndFetchUpdate.mockResolvedValue('up-to-date');
    render(
      <ErrorBoundary>
        <Boom fail />
      </ErrorBoundary>,
    );

    await act(async () => {
      fireEvent.press(screen.getByText('Chercher une version corrigée'));
    });

    expect(screen.getByText('Aucune version plus récente pour l’instant.')).toBeTruthy();
    expect(reloadAsync).not.toHaveBeenCalled();
  });
});
