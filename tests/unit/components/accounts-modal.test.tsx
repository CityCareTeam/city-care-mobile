import { AccountsModal } from '@/components/admin/AccountsModal';
import { getStrings } from '@/constants/i18n';
import { ADMIN_PAGE_SIZE, type AdminUser } from '@/services/admin';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/storage/tokens', () => ({ getValidToken: () => Promise.resolve('jeton') }));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ keycloakUser: { sub: 'moi' } }),
}));

// Préfixés `mock` : jest interdit à une fabrique de mock de refermer sur une
// variable ordinaire.
const mockUsers = jest.fn();
const mockRole = jest.fn();
jest.mock('@/services/admin', () => ({
  ...jest.requireActual('@/services/admin'),
  getAdminUsers: (...args: unknown[]) => mockUsers(...args),
  setUserRole: (...args: unknown[]) => mockRole(...args),
  setUserEnabled: () => Promise.resolve(),
}));

const t = getStrings();

function user(over: Partial<AdminUser> & { id: string }): AdminUser {
  return {
    username: over.id,
    email: `${over.id}@ville.fr`,
    display_name: over.id,
    enabled: true,
    role: 'citizen',
    ...over,
  };
}

const ZOE = user({ id: 'zoe', display_name: 'Zoé', role: 'citizen' });
const ANNA = user({ id: 'anna', display_name: 'Anna', role: 'agent' });
const BOB = user({ id: 'bob', display_name: 'Bob', role: 'admin' });
const COUPE = user({ id: 'coupe', display_name: 'Coupé', role: 'agent', enabled: false });

beforeEach(() => {
  mockUsers.mockReset().mockResolvedValue([ZOE, ANNA, BOB, COUPE]);
  mockRole.mockReset().mockResolvedValue(undefined);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

function open() {
  render(<AccountsModal visible onClose={() => {}} />);
}

/**
 * Déplie la carte d'un compte.
 *
 * Au repos une carte se lit, elle ne se manipule pas : les segments de rôle et le
 * bouton d'accès n'existent qu'une fois ouverte. Les tests d'action passent donc
 * tous par ici — comme l'administrateur.
 */
async function expand(name: string) {
  fireEvent.press(await screen.findByLabelText(name));
}

describe('AccountsModal — lire la liste', () => {
  /**
   * Le défaut d'origine : le serveur renvoie les rôles en minuscules et le
   * mobile comparait à des capitales. Aucune pastille ne s'allumait, la page ne
   * disait le rôle d'aucun compte.
   */
  it('montre le rôle de chaque compte', async () => {
    open();
    await screen.findByText('Zoé');

    // Cartes repliées : le libellé vient de la puce de filtre — une occurrence,
    // toujours — plus l'étiquette de chaque compte portant ce rôle. Au-delà de
    // un, c'est donc qu'un compte l'affiche bien.
    expect(screen.getAllByText(t.roles.Agent).length).toBeGreaterThan(1);
    expect(screen.getAllByText(t.roles.Admin).length).toBeGreaterThan(1);
  });

  /**
   * Le personnel d'abord, les comptes coupés en dernier : les trois agents d'une
   * ville se perdraient sinon au milieu de deux cents citoyens.
   */
  it('classe le personnel devant, les comptes coupés derrière', async () => {
    open();
    await screen.findByText('Zoé');

    const order = ['Bob', 'Anna', 'Zoé', 'Coupé'].map((name) =>
      screen.getByText(name).props.children,
    );
    expect(order).toEqual(['Bob', 'Anna', 'Zoé', 'Coupé']);
  });

  it('filtre par rôle, effectifs à l’appui', async () => {
    open();
    await screen.findByText('Zoé');

    // Les puces de filtre sont les seuls éléments de rôle « tab » : le libellé
    // « Agent municipal » apparaît aussi en étiquette et en segment sur chaque
    // carte. L'ordre est « Tous, Citoyen, Agent, Admin ».
    fireEvent.press(screen.getAllByRole('tab')[2]);
    await waitFor(() => expect(screen.queryByText('Zoé')).toBeNull());
    expect(screen.getByText('Anna')).toBeTruthy();
    expect(screen.getByText('Coupé')).toBeTruthy();
  });
});

describe('AccountsModal — agir', () => {
  it('change un rôle sans cérémonie', async () => {
    open();
    await expand('Zoé');

    // Une seule carte est ouverte : le segment est donc sans ambiguïté.
    fireEvent.press(screen.getByLabelText(t.roles.Agent));

    await waitFor(() => expect(mockRole).toHaveBeenCalled());
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  /**
   * Sauf pour les pleins pouvoirs : un administrateur peut tout faire, y compris
   * rétrograder celui qui vient de le nommer. Ce geste-là mérite la même friction
   * que couper un accès — et seulement celui-là, sinon on apprend à appuyer sur
   * « oui » sans lire.
   */
  it('demande confirmation avant de nommer un administrateur', async () => {
    open();
    await expand('Zoé');

    fireEvent.press(screen.getByLabelText(t.roles.Admin));

    expect(Alert.alert).toHaveBeenCalled();
    expect(mockRole).not.toHaveBeenCalled();
  });

  // On ne peut pas se rétrograder ni se couper l'accès — le serveur le refuse.
  // L'écran le dit au lieu d'éteindre des boutons sans un mot.
  it('explique pourquoi sa propre ligne est verrouillée', async () => {
    mockUsers.mockResolvedValue([user({ id: 'moi', display_name: 'Moi', role: 'admin' })]);
    open();
    await expand('Moi');

    expect(await screen.findByText(t.admin.selfHint)).toBeTruthy();
    expect(screen.queryByText(t.admin.disable)).toBeNull();
  });
});

describe('AccountsModal — pagination', () => {
  /**
   * Keycloak ne renvoie aucun total : une page pleine est le seul indice qu'il
   * en reste. L'absence de bouton est donc la seule façon honnête de dire qu'on
   * est arrivé au bout.
   */
  function fullPage(prefix: string) {
    return Array.from({ length: ADMIN_PAGE_SIZE }, (_, i) =>
      user({ id: `${prefix}-${i}`, display_name: `${prefix} ${i}` }),
    );
  }

  it('propose de charger la suite quand la page est pleine', async () => {
    mockUsers.mockResolvedValueOnce(fullPage('a'));
    open();

    expect(await screen.findByText(t.home.loadMore)).toBeTruthy();
  });

  it('ne propose rien quand la page est incomplète', async () => {
    open();
    await screen.findByText('Zoé');

    expect(screen.queryByText(t.home.loadMore)).toBeNull();
  });

  it('demande la page suivante au bon rang, et ajoute à la suite', async () => {
    mockUsers.mockResolvedValueOnce(fullPage('a')).mockResolvedValueOnce([
      user({ id: 'tardif', display_name: 'Tardif' }),
    ]);
    open();

    fireEvent.press(await screen.findByText(t.home.loadMore));

    await waitFor(() => expect(screen.getByText('Tardif')).toBeTruthy());
    // Le rang demandé est le nombre déjà affiché, pas un numéro de page : c'est
    // ce que Keycloak attend, et ça survit à un changement de taille de page.
    expect(mockUsers).toHaveBeenLastCalledWith('jeton', '', ADMIN_PAGE_SIZE);
    // La première page est toujours là.
    expect(screen.getByText('a 0')).toBeTruthy();
  });

  // Les effectifs des puces ne décrivent que ce qui est chargé : le dire évite
  // qu'on les lise comme des totaux.
  it('avertit que les effectifs sont partiels', async () => {
    mockUsers.mockResolvedValueOnce(fullPage('a'));
    open();

    expect(await screen.findByText(t.admin.partialCounts)).toBeTruthy();
  });
});
