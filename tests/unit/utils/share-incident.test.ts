import { en } from '@/constants/i18n/en';
import { fr } from '@/constants/i18n/fr';
import { incidentShareMessage, incidentUrl } from '@/utils/share-incident';

jest.mock('expo-linking', () => ({
  createURL: (path: string) => `citycaremobile://${path.replace(/^\//, '')}`,
}));

const incident = {
  id: 'abc-123',
  type: 'Road',
  addressLabel: '12 rue Victor-Hugo, Lyon',
};

describe('incidentUrl', () => {
  // Le scheme n'est pas recopié : il vient de la config, sinon il finirait par
  // diverger de `app.config.ts`.
  it('compose une adresse vers l’incident', () => {
    expect(incidentUrl('abc-123')).toBe('citycaremobile://incident/abc-123');
  });
});

describe('incidentShareMessage', () => {
  // Celui qui reçoit le lien doit savoir ce qu'il ouvre avant de l'ouvrir.
  it('annonce le type et le lieu avant le lien', () => {
    const message = incidentShareMessage(incident, fr);
    expect(message).toContain('Voirie');
    expect(message).toContain('12 rue Victor-Hugo, Lyon');
    expect(message).toContain('citycaremobile://incident/abc-123');
  });

  // Le lien passe en dernier : les messageries coupent la fin, jamais le début.
  it('place le lien en dernier', () => {
    const lines = incidentShareMessage(incident, fr).split('\n');
    expect(lines[lines.length - 1]).toBe('citycaremobile://incident/abc-123');
  });

  it('suit la langue de l’application', () => {
    expect(incidentShareMessage(incident, en)).toContain('Roads');
  });

  it('se passe d’adresse quand il n’y en a pas', () => {
    const message = incidentShareMessage({ ...incident, addressLabel: null }, fr);
    expect(message).toContain('Voirie');
    expect(message).not.toContain('—');
  });

  // Une adresse vide côté serveur ne doit pas produire un tiret orphelin.
  it('ignore une adresse vide', () => {
    const message = incidentShareMessage({ ...incident, addressLabel: '   ' }, fr);
    expect(message.split('\n')[0]).toBe('Voirie');
  });

  it('retombe sur la clé brute pour un type inconnu', () => {
    const message = incidentShareMessage({ ...incident, type: 'Meteorite' }, fr);
    expect(message).toContain('Meteorite');
  });
});
