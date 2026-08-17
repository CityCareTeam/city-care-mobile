/**
 * Distance telle qu'on la dit à voix haute.
 *
 * Trois régimes, parce qu'un même nombre n'a pas la même précision utile selon
 * l'échelle. Sous le kilomètre on parle en mètres, arrondis à dix : « 350 m »
 * est une indication, « 347 m » une illusion de précision — le GPS d'un
 * téléphone en ville se trompe de plus que ça. Entre un et dix kilomètres, une
 * décimale, parce que l'écart entre 1,2 et 1,8 km compte quand on décide d'y
 * aller à pied. Au-delà, l'entier suffit.
 */
export function formatDistance(km: number, locale = "fr-FR"): string {
  if (!Number.isFinite(km) || km < 0) return "";

  if (km < 1) {
    const meters = Math.max(10, Math.round((km * 1000) / 10) * 10);
    return `${meters} m`;
  }

  const digits = km < 10 ? 1 : 0;
  // `toLocaleString` pour la virgule décimale : « 1,2 km » en français, « 1.2 km »
  // en anglais. Le reste de l'application s'appuie déjà sur Intl.
  const value = km.toLocaleString(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${value} km`;
}
