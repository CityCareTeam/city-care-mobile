import { personalStats } from '@/utils/personal-stats';

const at = (day: number) => `2026-08-${String(day).padStart(2, '0')}T10:00:00Z`;
const report = (status: string, type = 'Road', day = 10) => ({ status, type, created_at: at(day) });

describe('personalStats', () => {
  it('compte les signalements par issue', () => {
    const stats = personalStats([
      report('resolved'),
      report('resolved'),
      report('in_progress'),
      report('reported'),
    ]);
    expect(stats.total).toBe(4);
    expect(stats.resolved).toBe(2);
    expect(stats.inProgress).toBe(1);
    expect(stats.reported).toBe(1);
    expect(stats.resolutionRate).toBe(0.5);
  });

  // Déduit et non filtré : un statut ajouté côté serveur après coup doit être
  // compté quelque part, pas disparaître d'un décompte qui prétend faire le tour.
  it('range un statut inconnu avec les déclarés', () => {
    const stats = personalStats([report('resolved'), report('sous_traite')]);
    expect(stats.total).toBe(2);
    expect(stats.reported).toBe(1);
  });

  // Un taux affiché tel quel : `NaN %` serait le premier chiffre qu'un nouvel
  // utilisateur verrait.
  it('rend zéro plutôt que NaN sans signalement', () => {
    const stats = personalStats([]);
    expect(stats.resolutionRate).toBe(0);
    expect(stats.topType).toBeNull();
    expect(stats.since).toBeNull();
  });

  it('désigne la catégorie la plus signalée', () => {
    const stats = personalStats([
      report('reported', 'Waste'),
      report('reported', 'Waste'),
      report('reported', 'Road'),
    ]);
    expect(stats.topType).toEqual({ type: 'Waste', count: 2 });
  });

  // Départager deux ex æquo par ordre alphabétique donnerait une précision que
  // la donnée n'a pas : le premier rencontré l'emporte.
  it('garde le premier rencontré en cas d’égalité', () => {
    const stats = personalStats([report('reported', 'Road'), report('reported', 'Waste')]);
    expect(stats.topType).toEqual({ type: 'Road', count: 1 });
  });

  it('retient le plus ancien signalement', () => {
    const stats = personalStats([
      report('reported', 'Road', 16),
      report('reported', 'Road', 3),
      report('reported', 'Road', 9),
    ]);
    expect(stats.since).toBe(at(3));
  });

  it('atteint cent pour cent quand tout est résolu', () => {
    expect(personalStats([report('resolved'), report('resolved')]).resolutionRate).toBe(1);
  });
});
