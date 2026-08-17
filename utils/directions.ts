import { Linking, Platform } from "react-native";

/**
 * Itinéraire vers un point, dans l'application de cartes du téléphone.
 *
 * On ne guide pas soi-même : personne ne veut d'un troisième moteur de
 * navigation, et celui du téléphone connaît les embouteillages, les transports
 * et la voix de l'utilisateur. Un agent qui part sur site recopie aujourd'hui
 * l'adresse à la main dans Maps ; ce lien lui économise ce trajet-là.
 *
 * `geo:` est le schéma d'intention Android. Les coordonnées sont répétées dans
 * la requête `q` : sans elle, plusieurs applications ouvrent la carte au bon
 * endroit mais sans lancer l'itinéraire. Le libellé après la virgule est ce que
 * l'application affichera comme destination.
 *
 * iOS n'a pas de `geo:` — on y passe par `maps.apple.com`, qui ouvre
 * l'application native. Le nom du lieu part en `q` là aussi.
 */
export function directionsUrl(
  place: { latitude: number; longitude: number },
  label?: string | null,
): string {
  const { latitude, longitude } = place;
  const name = label?.trim() ? encodeURIComponent(label.trim()) : "";

  if (Platform.OS === "ios") {
    const query = name || `${latitude},${longitude}`;
    return `https://maps.apple.com/?daddr=${latitude},${longitude}&q=${query}`;
  }

  const query = name ? `${latitude},${longitude}(${name})` : `${latitude},${longitude}`;
  return `geo:${latitude},${longitude}?q=${query}`;
}

/**
 * Ouvre l'itinéraire, et rend `false` si aucune application n'a répondu.
 *
 * Un téléphone sans application de cartes est rare mais existe — un appareil de
 * test dégarni, par exemple. L'appelant doit pouvoir le dire plutôt que de
 * laisser un bouton sans effet.
 */
export async function openDirections(
  place: { latitude: number; longitude: number },
  label?: string | null,
): Promise<boolean> {
  try {
    await Linking.openURL(directionsUrl(place, label));
    return true;
  } catch {
    return false;
  }
}
