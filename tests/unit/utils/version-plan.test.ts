import plan from '@/version-plan.json';
import { GENERATED_CHANGELOG, LAST_RELEASED_VERSION } from '@/constants/changelog.generated';

const parse = (v: string) => v.split('.').map(Number);

describe('version-plan.json', () => {
  it('reflète la dernière version tagguée', () => {
    expect(plan.lastReleased).toBe(LAST_RELEASED_VERSION);
    expect(GENERATED_CHANGELOG[0].version).toBe(plan.lastReleased);
  });

  it('annonce un palier connu', () => {
    expect(['none', 'patch', 'minor', 'major']).toContain(plan.bump);
  });

  // Le cœur du sujet : incrémenter le patch à l'aveugle faisait annoncer une
  // 1.5.5 là où un seul `feat:` aurait fait sortir semantic-release en 1.6.0.
  it('applique le palier prédit à la dernière version', () => {
    const [major, minor, patch] = parse(plan.lastReleased);
    const expected = {
      major: `${major + 1}.0.0`,
      minor: `${major}.${minor + 1}.0`,
      patch: `${major}.${minor}.${patch + 1}`,
      none: `${major}.${minor}.${patch + 1}`,
    }[plan.bump];

    expect(plan.nextVersion).toBe(expected);
  });

  it('vise toujours une version strictement supérieure', () => {
    const next = parse(plan.nextVersion);
    const last = parse(plan.lastReleased);
    const ahead =
      next[0] > last[0] ||
      (next[0] === last[0] && next[1] > last[1]) ||
      (next[0] === last[0] && next[1] === last[1] && next[2] > last[2]);
    expect(ahead).toBe(true);
  });

  it('ne vise pas une version déjà publiée', () => {
    expect(GENERATED_CHANGELOG.map((n) => n.version)).not.toContain(plan.nextVersion);
  });
});
