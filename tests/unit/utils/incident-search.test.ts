import { distanceKm, matchesQuery, normalize, sortIncidents } from '@/utils/incident-search';

const incident = (over: Partial<Parameters<typeof matchesQuery>[0]> = {}) => ({
  description: 'Poubelle renversée',
  addressLabel: '12 rue Victor-Hugo, Lyon',
  latitude: 45.75,
  longitude: 4.85,
  createdAt: '2026-08-16T10:00:00Z',
  ...over,
});

describe('normalize', () => {
  // Personne ne tape les accents sur un clavier de téléphone.
  it('retire accents et casse', () => {
    expect(normalize('Éclairage CASSÉ')).toBe('eclairage casse');
    expect(normalize('  Voirie  ')).toBe('voirie');
  });
});

describe('matchesQuery', () => {
  it('trouve dans la description comme dans l’adresse', () => {
    expect(matchesQuery(incident(), 'poubelle')).toBe(true);
    expect(matchesQuery(incident(), 'victor-hugo')).toBe(true);
  });

  it('ignore les accents et la casse', () => {
    expect(matchesQuery(incident(), 'RENVERSEE')).toBe(true);
  });

  // « poubelle victor » doit fonctionner : les deux mots sont dans deux champs
  // différents, et dans un ordre que personne n'a en tête.
  it('accepte des mots dispersés, dans n’importe quel ordre', () => {
    expect(matchesQuery(incident(), 'victor poubelle')).toBe(true);
  });

  it('exige que chaque mot soit présent', () => {
    expect(matchesQuery(incident(), 'poubelle lampadaire')).toBe(false);
  });

  it('laisse tout passer sur une recherche vide', () => {
    expect(matchesQuery(incident(), '   ')).toBe(true);
  });

  it('supporte les champs absents', () => {
    expect(matchesQuery(incident({ description: null, addressLabel: null }), 'rien')).toBe(false);
  });
});

describe('distanceKm', () => {
  it('rend zéro pour le même point', () => {
    expect(distanceKm({ latitude: 45.75, longitude: 4.85 }, { latitude: 45.75, longitude: 4.85 })).toBe(0);
  });

  // Lyon → Paris, environ 392 km à vol d'oiseau.
  it('mesure une distance connue', () => {
    const km = distanceKm({ latitude: 45.75, longitude: 4.85 }, { latitude: 48.857, longitude: 2.352 });
    expect(km).toBeGreaterThan(380);
    expect(km).toBeLessThan(400);
  });
});

describe('sortIncidents', () => {
  const older = incident({ createdAt: '2026-08-10T10:00:00Z' });
  const newer = incident({ createdAt: '2026-08-16T10:00:00Z' });
  const far = incident({ latitude: 48.857, longitude: 2.352 });

  it('classe du plus récent au plus ancien', () => {
    expect(sortIncidents([older, newer], 'recent', null)[0]).toBe(newer);
  });

  it('classe du plus ancien au plus récent', () => {
    expect(sortIncidents([newer, older], 'oldest', null)[0]).toBe(older);
  });

  it('classe par distance quand la position est connue', () => {
    const origin = { latitude: 45.75, longitude: 4.85 };
    expect(sortIncidents([far, newer], 'nearest', origin)[0]).toBe(newer);
  });

  // Sans position, trier « au plus proche » n'aurait aucun sens : on ne touche
  // à rien plutôt que de réordonner au hasard.
  it('ne réordonne rien sans position', () => {
    const list = [far, newer];
    expect(sortIncidents(list, 'nearest', null)).toBe(list);
  });

  // La liste vient de l'état React : la trier sur place la modifierait sans que
  // React le sache.
  it('ne modifie jamais la liste reçue', () => {
    const list = [older, newer];
    sortIncidents(list, 'recent', null);
    expect(list[0]).toBe(older);
  });
});
