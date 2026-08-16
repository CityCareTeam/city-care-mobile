import AsyncStorage from '@react-native-async-storage/async-storage';
import { isFollowed, listFollowed, toggleFollowed } from '@/storage/followed-incidents';

beforeEach(() => AsyncStorage.clear());

describe('followed-incidents', () => {
  it('ne suit rien au départ', async () => {
    expect(await listFollowed()).toEqual([]);
  });

  // La bascule rend l'état obtenu : c'est ce que l'appelant affiche, sans
  // relire le disque derrière.
  it('bascule et rend l’état obtenu', async () => {
    expect(await toggleFollowed('inc-1')).toBe(true);
    expect(await isFollowed('inc-1')).toBe(true);

    expect(await toggleFollowed('inc-1')).toBe(false);
    expect(await isFollowed('inc-1')).toBe(false);
  });

  it('ne touche pas aux autres suivis', async () => {
    await toggleFollowed('inc-1');
    await toggleFollowed('inc-2');
    await toggleFollowed('inc-1');
    expect(await listFollowed()).toEqual(['inc-2']);
  });

  it('ne suit pas deux fois le même', async () => {
    await toggleFollowed('inc-1');
    await toggleFollowed('inc-2');
    expect(await listFollowed()).toEqual(['inc-1', 'inc-2']);
  });

  it('ignore un contenu illisible', async () => {
    await AsyncStorage.setItem('followed_incidents', 'pas du JSON');
    expect(await listFollowed()).toEqual([]);
  });

  // Une version antérieure aurait pu écrire autre chose que des chaînes.
  it('écarte ce qui n’est pas un identifiant', async () => {
    await AsyncStorage.setItem('followed_incidents', JSON.stringify(['inc-1', 42, null]));
    expect(await listFollowed()).toEqual(['inc-1']);
  });
});
