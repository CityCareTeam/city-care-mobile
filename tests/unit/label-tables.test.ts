import { setActiveLanguage } from '@/constants/i18n';
import { STATUS_LABEL, TYPE_LABEL, TYPE_LABEL_SNAKE } from '@/constants/incidents';
import { ROLE_LABELS } from '@/constants/roles';

afterEach(() => setActiveLanguage('fr'));

/**
 * Ces tables sont des relais vers la langue active. Un relais qui n'intercepte
 * que la lecture d'une clé paraît être un objet sans en être un : `Object.keys`
 * le voit vide. C'est ce qui avait vidé le filtre par type de la carte et la
 * liste des types suivis — d'où ces tests sur l'énumération autant que sur la
 * lecture.
 */
describe('tables de libellés', () => {
  it('s’énumèrent comme des objets ordinaires', () => {
    expect(Object.keys(TYPE_LABEL)).toEqual(
      expect.arrayContaining(['Road', 'Lighting', 'Waste', 'Graffiti', 'Safety', 'Other']),
    );
    expect(Object.keys(STATUS_LABEL)).toEqual(['reported', 'in_progress', 'resolved']);
    expect(Object.keys(ROLE_LABELS)).toEqual(['Admin', 'Agent', 'Citizen']);
  });

  it('rendent des paires clé/valeur exploitables', () => {
    const entries = Object.entries(TYPE_LABEL_SNAKE);
    expect(entries.length).toBe(6);
    expect(entries).toContainEqual(['road', 'Voirie']);
  });

  it('répondent à l’opérateur `in`', () => {
    expect('reported' in STATUS_LABEL).toBe(true);
    expect('meteorite' in STATUS_LABEL).toBe(false);
  });

  it('suivent la langue active', () => {
    expect(TYPE_LABEL.Road).toBe('Voirie');
    setActiveLanguage('en');
    expect(TYPE_LABEL.Road).toBe('Roads');
    expect(ROLE_LABELS.Agent).toBe('City officer');
    expect(Object.entries(TYPE_LABEL_SNAKE)).toContainEqual(['road', 'Roads']);
  });

  it('gardent leurs clés d’une langue à l’autre', () => {
    const french = Object.keys(TYPE_LABEL);
    setActiveLanguage('en');
    expect(Object.keys(TYPE_LABEL)).toEqual(french);
  });
});
