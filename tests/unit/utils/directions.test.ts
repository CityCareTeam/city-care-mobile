import { directionsUrl } from '@/utils/directions';
import { Platform } from 'react-native';

const LYON = { latitude: 45.758, longitude: 4.835 };

/**
 * Le préréglage jest-expo fait tourner toute la suite avec `Platform.OS` à
 * `ios` : une fonction qui distingue les plateformes doit donc la poser
 * elle-même, sinon la moitié du code n'est jamais exécutée.
 */
function on<T>(os: 'ios' | 'android', run: () => T): T {
  const previous = Platform.OS;
  Platform.OS = os;
  try {
    return run();
  } finally {
    Platform.OS = previous;
  }
}

describe('directionsUrl', () => {
  it('compose une intention Android', () => {
    const url = on('android', () => directionsUrl(LYON, 'Place Bellecour'));

    expect(url.startsWith('geo:45.758,4.835')).toBe(true);
    // Les coordonnées sont répétées dans `q` : sans elle, plusieurs
    // applications ouvrent la carte au bon endroit sans lancer l'itinéraire.
    expect(url).toContain('?q=45.758,4.835(Place%20Bellecour)');
  });

  it('se passe d’un libellé absent ou vide', () => {
    expect(on('android', () => directionsUrl(LYON))).toBe('geo:45.758,4.835?q=45.758,4.835');
    expect(on('android', () => directionsUrl(LYON, '   '))).toBe('geo:45.758,4.835?q=45.758,4.835');
  });

  // Un signalement peut porter une adresse à apostrophe ou à espaces : elle ne
  // doit pas couper l'URL en deux.
  it('encode un libellé qui contient des caractères d’URL', () => {
    const url = on('android', () => directionsUrl(LYON, "Rue de l'Église & Cie"));
    expect(url).toContain("Rue%20de%20l'%C3%89glise%20%26%20Cie");
  });

  it('passe par maps.apple.com sur iOS, qui n’a pas de geo:', () => {
    const url = on('ios', () => directionsUrl(LYON, 'Place Bellecour'));

    expect(url).toContain('maps.apple.com');
    expect(url).toContain('daddr=45.758,4.835');
    expect(url).toContain('q=Place%20Bellecour');
  });
});
