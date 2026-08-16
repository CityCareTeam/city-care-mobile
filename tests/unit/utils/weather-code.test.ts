import { conditionFromCode, formatTemperature, weatherIcon } from '@/utils/weather-code';

describe('conditionFromCode', () => {
  it('range les codes WMO dans les huit conditions retenues', () => {
    expect(conditionFromCode(0)).toBe('clear');
    expect(conditionFromCode(2)).toBe('partlyCloudy');
    expect(conditionFromCode(3)).toBe('cloudy');
    expect(conditionFromCode(48)).toBe('fog');
    expect(conditionFromCode(53)).toBe('drizzle');
    expect(conditionFromCode(65)).toBe('rain');
    expect(conditionFromCode(75)).toBe('snow');
    expect(conditionFromCode(95)).toBe('thunderstorm');
  });

  // Les averses sont de la pluie : la distinction ne se dessine pas sur une
  // icône de quatorze pixels.
  it('regroupe les averses avec la pluie', () => {
    expect(conditionFromCode(80)).toBe('rain');
    expect(conditionFromCode(82)).toBe('rain');
  });

  // Se tromper vers le gris se remarque moins que promettre un beau temps.
  it('retombe sur « couvert » pour un code inconnu', () => {
    expect(conditionFromCode(999)).toBe('cloudy');
    expect(conditionFromCode(-1)).toBe('cloudy');
  });
});

describe('weatherIcon', () => {
  it('donne une icône à chaque condition', () => {
    expect(weatherIcon('rain', true)).toBe('umbrella');
    expect(weatherIcon('snow', true)).toBe('ac-unit');
    expect(weatherIcon('thunderstorm', true)).toBe('thunderstorm');
  });

  // Un soleil à vingt-trois heures est une erreur que tout le monde voit.
  it('remplace le soleil par la lune de nuit', () => {
    expect(weatherIcon('clear', true)).toBe('wb-sunny');
    expect(weatherIcon('clear', false)).toBe('nights-stay');
  });

  it('ne change rien d’autre la nuit', () => {
    expect(weatherIcon('cloudy', false)).toBe(weatherIcon('cloudy', true));
    expect(weatherIcon('rain', false)).toBe(weatherIcon('rain', true));
  });
});

describe('formatTemperature', () => {
  it('arrondit au degré', () => {
    expect(formatTemperature(26.9)).toBe('27°');
    expect(formatTemperature(18.2)).toBe('18°');
  });

  it('garde les températures négatives lisibles', () => {
    expect(formatTemperature(-3.4)).toBe('-3°');
  });
});
