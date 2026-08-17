import { NEWS_CITIES, cityById } from '@/constants/news-cities';
import { nearestCity } from '@/utils/news-city';

const LYON = { latitude: 45.758, longitude: 4.835 };
const VILLEURBANNE = { latitude: 45.7719, longitude: 4.8902 };
const RENNES = { latitude: 48.1109, longitude: -1.6837 };
const TOULOUSE = { latitude: 43.6041, longitude: 1.4338 };
const PARIS = { latitude: 48.8566, longitude: 2.3522 };
/** 60,4 km de Lyon : la commune qui a fait bouger le rayon. */
const PLATEAU_HAUTEVILLE = { latitude: 45.9298, longitude: 5.5744 };

describe('nearestCity', () => {
  it('reconnaît la ville sous les pieds de l’utilisateur', () => {
    expect(nearestCity(LYON)?.id).toBe('lyon');
    expect(nearestCity(RENNES)?.id).toBe('rennes');
    expect(nearestCity(TOULOUSE)?.id).toBe('toulouse');
  });

  /**
   * Le plateau se désigne lui-même, alors qu'il n'a pas d'agenda : c'est tout
   * l'intérêt d'interroger un point plutôt qu'un identifiant. Sans lui dans la
   * liste, il tombait sur Lyon à 60,4 km — quatre cents mètres au-delà du seuil
   * d'alors, qui l'aurait laissé sans rien.
   */
  it('rattache le Plateau d’Hauteville à lui-même, pas à Lyon', () => {
    expect(nearestCity(PLATEAU_HAUTEVILLE)?.id).toBe('plateau-hauteville');
  });

  // Une commune voisine du plateau ne doit pas basculer sur Lyon.
  it('couvre les alentours du plateau', () => {
    // Cormaranche-en-Bugey, 5 km au sud.
    expect(nearestCity({ latitude: 45.8952, longitude: 5.5567 })?.id).toBe('plateau-hauteville');
  });

  // L'agenda couvre une métropole : être dans une commune voisine ne doit pas
  // priver d'événements.
  it('rattache une commune de l’agglomération à sa métropole', () => {
    expect(nearestCity(VILLEURBANNE)?.id).toBe('lyon');
  });

  /**
   * Le cœur de la fonction. Depuis Paris, la ville « la plus proche » est
   * Rennes à trois cents kilomètres — proposer son agenda serait pire que ne
   * rien proposer, puisque l'écran ne dirait alors pas qu'il s'est rabattu.
   */
  it('ne propose rien plutôt que la moins mauvaise des villes', () => {
    expect(nearestCity(PARIS)).toBeNull();
  });

  it('respecte le rayon qu’on lui donne', () => {
    // Depuis Paris, Dijon est à 262 km et Rennes à 308.
    expect(nearestCity(PARIS, NEWS_CITIES, 400)?.id).toBe('dijon');
    expect(nearestCity(VILLEURBANNE, NEWS_CITIES, 1)).toBeNull();
  });
});

describe('cityById', () => {
  it('retrouve une ville gardée d’une session à l’autre', () => {
    expect(cityById('rennes')?.name).toBe('Rennes');
  });

  // Une ville retirée de la liste ne doit pas empêcher l'écran de s'ouvrir.
  it('ignore un identifiant inconnu ou absent', () => {
    expect(cityById('bordeaux')).toBeNull();
    expect(cityById(null)).toBeNull();
  });
});

describe('NEWS_CITIES', () => {
  it('n’a pas d’identifiant en double', () => {
    expect(new Set(NEWS_CITIES.map((c) => c.id)).size).toBe(NEWS_CITIES.length);
  });

  // Un lieu sans source est un onglet qui s'ouvre sur rien, sans que l'écran
  // ait de quoi l'expliquer.
  it('donne à chaque lieu au moins une source exploitable', () => {
    for (const city of NEWS_CITIES) {
      expect(city.sources.length).toBeGreaterThan(0);
      for (const source of city.sources) {
        if (source.kind === 'openagenda') {
          expect(source.radiusKm).toBeGreaterThanOrEqual(5);
          expect(source.radiusKm).toBeLessThanOrEqual(50);
        } else {
          expect(source.url).toMatch(/^https:\/\//);
          expect(source.label.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
