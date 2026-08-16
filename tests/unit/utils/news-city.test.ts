import { NEWS_CITIES, cityById } from '@/constants/news-cities';
import { nearestCity } from '@/utils/news-city';

const LYON = { latitude: 45.758, longitude: 4.832 };
const VILLEURBANNE = { latitude: 45.7719, longitude: 4.8902 };
const RENNES = { latitude: 48.1147, longitude: -1.6794 };
const PARIS = { latitude: 48.8566, longitude: 2.3522 };

describe('nearestCity', () => {
  it('reconnaît la ville sous les pieds de l’utilisateur', () => {
    expect(nearestCity(LYON)?.id).toBe('lyon');
    expect(nearestCity(RENNES)?.id).toBe('rennes');
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
    expect(nearestCity(PARIS, NEWS_CITIES, 400)?.id).toBe('rennes');
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
  it('n’a ni identifiant ni agenda en double', () => {
    expect(new Set(NEWS_CITIES.map((c) => c.id)).size).toBe(NEWS_CITIES.length);
    expect(new Set(NEWS_CITIES.map((c) => c.agendaUid)).size).toBe(NEWS_CITIES.length);
  });
});
