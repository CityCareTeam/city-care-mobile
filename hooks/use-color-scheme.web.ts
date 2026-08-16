import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 *
 * ⚠️ Contrairement à la version native, celle-ci ignore la préférence de thème
 * de `PreferencesContext` : elle suit le système, point. L'application n'est pas
 * distribuée sur le web, et l'hydratation statique demande un traitement à part
 * qu'il faudra reprendre le jour où elle le sera.
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
