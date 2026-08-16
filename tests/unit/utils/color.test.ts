import { mixHex } from '@/utils/color';

describe('mixHex', () => {
  it('rend la base à 0 et la teinte à 1', () => {
    expect(mixHex('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mixHex('#000000', '#ffffff', 1)).toBe('#ffffff');
  });

  it('mélange à mi-chemin', () => {
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
  });

  // Le cas réel : la surface beige teintée d'un soupçon d'orange, en opaque.
  it('teinte une surface sans transparence', () => {
    const tinted = mixHex('#f9f4e4', '#f6aa54', 0.09);
    expect(tinted).toMatch(/^#[0-9a-f]{6}$/);
    expect(tinted).not.toBe('#f9f4e4');
  });

  it('accepte la notation courte', () => {
    expect(mixHex('#000', '#fff', 1)).toBe('#ffffff');
  });

  // Une couleur illisible ne doit pas rendre une chaîne cassée : le style
  // recevrait `#NaNNaNNaN` et la vue disparaîtrait.
  it('rend la base telle quelle si une couleur est illisible', () => {
    expect(mixHex('#f9f4e4', 'rgba(0,0,0,0.5)', 0.5)).toBe('#f9f4e4');
    expect(mixHex('pas une couleur', '#ffffff', 0.5)).toBe('pas une couleur');
  });

  it('borne le ratio', () => {
    expect(mixHex('#000000', '#ffffff', 2)).toBe('#ffffff');
    expect(mixHex('#000000', '#ffffff', -1)).toBe('#000000');
  });
});
