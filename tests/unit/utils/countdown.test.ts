import { fr } from '@/constants/i18n/fr';
import { countdown } from '@/utils/countdown';

// Un lundi, en milieu d'après-midi.
const NOW = new Date(2026, 7, 17, 15, 0, 0);

function at(offsetMs: number) {
  return new Date(NOW.getTime() + offsetMs).toISOString();
}

describe('countdown', () => {
  it('dit qu’un événement est en cours', () => {
    expect(countdown(at(-2 * 3600_000), fr, NOW)).toBe(fr.countdown.now);
  });

  it('dit l’imminence en dessous d’une heure', () => {
    expect(countdown(at(20 * 60_000), fr, NOW)).toBe(fr.countdown.soon);
  });

  it('compte en heures dans la journée', () => {
    expect(countdown(at(5 * 3600_000), fr, NOW)).toBe('Dans 5 h');
  });

  /**
   * On compte en jours de calendrier, pas en tranches de vingt-quatre heures :
   * un événement demain à 9 h est « demain », même s'il n'est que dans dix-huit
   * heures — c'est ainsi qu'on en parle.
   */
  it('dit « demain » pour demain matin, pas « dans 18 h »', () => {
    const tomorrowMorning = new Date(2026, 7, 18, 9, 0, 0).toISOString();
    expect(countdown(tomorrowMorning, fr, NOW)).toBe(fr.countdown.tomorrow);
  });

  it('compte les jours au-delà', () => {
    const inFiveDays = new Date(2026, 7, 22, 10, 0, 0).toISOString();
    expect(countdown(inFiveDays, fr, NOW)).toBe('Dans 5 jours');
  });

  // « Dans 47 jours » n'aide personne à décider quoi que ce soit, et la date est
  // déjà affichée juste à côté.
  it('se tait au-delà d’un mois', () => {
    expect(countdown(at(60 * 86_400_000), fr, NOW)).toBe('');
  });

  it('se tait sur ce qu’elle ne sait pas lire', () => {
    expect(countdown(null, fr, NOW)).toBe('');
    expect(countdown('pas une date', fr, NOW)).toBe('');
  });
});
