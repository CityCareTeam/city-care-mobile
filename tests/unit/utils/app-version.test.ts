import { baseVersion, buildLabel, minorOf, preRelease } from '@/utils/app-version';

describe('découpage de la version', () => {
  it('sépare la version livrée de son suffixe', () => {
    expect(baseVersion('1.6.0-beta.3')).toBe('1.6.0');
    expect(baseVersion('1.6.0')).toBe('1.6.0');
  });

  // Les deux formes coexistent : la pastille de version n'a la place que du
  // rang, l'écran des mises à jour nomme aussi le canal.
  it('rend le rang seul, ou le canal avec son rang', () => {
    expect(buildLabel('1.6.0-beta.3')).toBe('3');
    expect(preRelease('1.6.0-beta.3')).toBe('beta.3');
  });

  it('ne rend rien sur une version livrée', () => {
    expect(buildLabel('1.6.0')).toBe('');
    expect(preRelease('1.6.0')).toBe('');
  });

  /**
   * Le piège que ces deux fonctions documentent : un repère nommé peut contenir
   * un tiret, et un découpage naïf le tronquerait à « fix ».
   */
  it('survit à un repère nommé qui contient un tiret', () => {
    expect(baseVersion('1.6.0-beta.fix-clusters')).toBe('1.6.0');
    expect(preRelease('1.6.0-beta.fix-clusters')).toBe('beta.fix-clusters');
    expect(buildLabel('1.6.0-beta.fix-clusters')).toBe('fix-clusters');
  });

  it('réduit une version à sa mineure', () => {
    expect(minorOf('1.6.0')).toBe('1.6');
  });
});
