import { eventShareMessage } from '@/utils/share-incident';

const EVENT = {
  title: 'Nuit de la chauve-souris',
  when: 'Samedi 5 septembre, 16h00',
  place: 'Franclens',
  url: 'https://openagenda.com/agenda/events/nuit-chauve-souris',
};

describe('eventShareMessage', () => {
  /**
   * Ce qu'on partage d'abord, où et quand ensuite, le lien en dernier : les
   * messageries coupent la fin, jamais le début.
   */
  it('met le titre en tête et le lien en queue', () => {
    const lines = eventShareMessage(EVENT).split('\n');

    expect(lines[0]).toBe(EVENT.title);
    expect(lines[1]).toBe('Samedi 5 septembre, 16h00 · Franclens');
    expect(lines[2]).toBe(EVENT.url);
  });

  it('se passe de ce qui manque sans laisser de ligne vide', () => {
    const lines = eventShareMessage({ title: 'Marché', place: null }).split('\n');
    expect(lines).toEqual(['Marché']);
  });

  it('garde la date seule quand le lieu manque', () => {
    const lines = eventShareMessage({ title: 'Marché', when: 'Mercredi' }).split('\n');
    expect(lines).toEqual(['Marché', 'Mercredi']);
  });

  /**
   * Le lien est l'adresse publique de la source, pas un lien profond : on
   * partage un événement avec quelqu'un qui n'a pas l'application, et un lien
   * qui exige de l'installer ne se partage pas.
   */
  it('transmet l’adresse publique telle quelle', () => {
    expect(eventShareMessage(EVENT)).toContain('https://openagenda.com/');
    expect(eventShareMessage(EVENT)).not.toContain('citycare');
  });
});
