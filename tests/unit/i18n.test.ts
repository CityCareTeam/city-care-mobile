import { en } from '@/constants/i18n/en';
import { fr } from '@/constants/i18n/fr';
import { deviceLanguage, dictionaryFor, resolveLanguage } from '@/constants/i18n';
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

  // Certaines entrées sont des fonctions : les pluriels et les textes qui
  // portent une valeur. On les appelle pour vérifier qu'elles rendent bien
  // quelque chose — une chaîne vide passerait sinon inaperçue.
  it('ne laissent aucune chaîne vide', () => {
    for (const dictionary of [fr, en]) {
      for (const path of paths(dictionary)) {
        const entry = path.split('.').reduce<any>((node, key) => node[key], dictionary);
        const value = typeof entry === 'function' ? entry(2) : entry;
        expect(typeof value).toBe('string');
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });

  // Un pluriel qui ignore son argument est un pluriel raté.
  it('accordent les pluriels', () => {
    expect(fr.home.totalReports(1)).toContain('1 signalement au total');
    expect(fr.home.totalReports(3)).toContain('3 signalements');
    expect(en.home.totalReports(1)).toContain('1 report in total');
    expect(en.home.totalReports(3)).toContain('3 reports');
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

  // Le cas qui a fait tomber la CI : la locale de la machine décidait de la
  // langue de l'application, et le runner tourne en anglais.
  it('lit la locale de l’appareil', () => {
    const spy = jest
      .spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
      .mockReturnValue({ locale: 'en-US' } as Intl.ResolvedDateTimeFormatOptions);
    expect(deviceLanguage()).toBe('en');
    spy.mockRestore();
  });

  // Tout ce qui n'est pas anglais retombe sur le français : c'est la langue de
  // la ville, et une locale inconnue est plus probablement francophone ici.
  it('retombe sur le français pour une locale inconnue', () => {
    const spy = jest
      .spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
      .mockReturnValue({ locale: 'de-DE' } as Intl.ResolvedDateTimeFormatOptions);
    expect(deviceLanguage()).toBe('fr');
    spy.mockRestore();
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

/**
 * La traduction avait un trou : les durées relatives et les dates restaient en
 * français quelle que soit la langue, sur chaque ligne de notification et
 * d'incident. Ces tests le referment.
 */
describe('dates et durées', () => {
  it('traduisent les durées relatives', () => {
    expect(fr.relative.now).not.toBe(en.relative.now);
    expect(fr.relative.minutes(5)).toContain('Il y a');
    expect(en.relative.minutes(5)).toContain('ago');
    expect(en.relative.yesterday).toBe('Yesterday');
  });

  it('portent chacun leur locale de formatage', () => {
    expect(fr.locale).toBe('fr-FR');
    expect(en.locale).toBe('en-GB');
  });

  // Ce que voit l'utilisateur : la même date, dans sa langue.
  it('formatent la même date dans les deux langues', () => {
    const date = new Date('2026-08-16T10:00:00Z');
    expect(date.toLocaleDateString(fr.locale, { month: 'long' })).toBe('août');
    expect(date.toLocaleDateString(en.locale, { month: 'long' })).toBe('August');
  });
});
