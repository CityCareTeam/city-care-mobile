import { en } from '@/constants/i18n/en';
import { fr } from '@/constants/i18n/fr';
import { dictionaryFor, resolveLanguage } from '@/constants/i18n';
import { STRINGS } from '@/constants/strings';

/** Aplati un dictionnaire en chemins, pour comparer deux langues clé à clé. */
function paths(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    paths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe('dictionnaires', () => {
  // Le typage l'impose déjà au build ; ce test le dit à la lecture, et attrape
  // le cas où quelqu'un élargirait le type pour se débarrasser de l'erreur.
  it('portent exactement les mêmes clés', () => {
    expect(paths(en).sort()).toEqual(paths(fr).sort());
  });

  it('ne laissent aucune chaîne vide', () => {
    for (const dictionary of [fr, en]) {
      for (const path of paths(dictionary)) {
        const value = path.split('.').reduce<any>((node, key) => node[key], dictionary);
        expect(typeof value).toBe('string');
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });

  // Une traduction oubliée se voit ici : la valeur anglaise serait le français.
  it('traduisent réellement les textes visibles', () => {
    expect(en.settings.title).not.toBe(fr.settings.title);
    expect(en.tabs.home).not.toBe(fr.tabs.home);
    expect(en.updates.check).not.toBe(fr.updates.check);
  });
});

describe('résolution de la langue', () => {
  it('respecte un choix explicite', () => {
    expect(resolveLanguage('en')).toBe('en');
    expect(resolveLanguage('fr')).toBe('fr');
  });

  it('rend une langue connue pour « système »', () => {
    expect(['fr', 'en']).toContain(resolveLanguage('system'));
  });

  it('sert le bon dictionnaire', () => {
    expect(dictionaryFor('en')).toBe(en);
    expect(dictionaryFor('fr')).toBe(fr);
  });
});

describe('STRINGS', () => {
  // Une quinzaine de fichiers lisent STRINGS hors de tout rendu : le relais doit
  // rester transparent pour eux.
  it('donne accès aux textes sans changer d’interface', () => {
    expect(typeof STRINGS.api.networkError).toBe('string');
    expect(STRINGS.emptyState.noIncidents.length).toBeGreaterThan(0);
  });
});
