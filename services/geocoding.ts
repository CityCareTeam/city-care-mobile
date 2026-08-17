/**
 * Recherche d'adresse, par Nominatim.
 *
 * Le formulaire de signalement interrogeait ce service depuis son propre corps.
 * La carte en a besoin à son tour, et deux appels écrits séparément auraient
 * divergé sur le détail qui compte ici : l'en-tête `User-Agent`, que la
 * politique d'usage de Nominatim exige, et sans lequel le service finit par
 * refuser de répondre.
 *
 * Cette même politique demande de ne pas dépasser une requête par seconde :
 * c'est à l'appelant de différer les frappes, et les deux écrans le font.
 */
const ENDPOINT = "https://nominatim.openstreetmap.org/search";

const HEADERS = { "User-Agent": "CityCare/1.0" };

export type PlaceSuggestion = {
  label: string;
  latitude: number;
  longitude: number;
};

type NominatimResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
};

/** Degrés autour du point de référence dans lesquels on privilégie les résultats. */
const BIAS_SPAN = 0.5;

/**
 * Adresses correspondant à une saisie.
 *
 * `near` sert à privilégier les environs sans les imposer — chercher
 * « Garibaldi » depuis Lyon doit proposer la rue Garibaldi avant une place
 * italienne, mais chercher une ville lointaine doit rester possible. D'où
 * `viewbox` sans `bounded`, qui trie sans exclure.
 */
export async function searchPlaces(
  query: string,
  near?: { latitude: number; longitude: number } | null,
  limit = 5,
): Promise<PlaceSuggestion[]> {
  const url = new URL(ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("addressdetails", "1");

  if (near) {
    const box = [
      near.longitude - BIAS_SPAN,
      near.latitude + BIAS_SPAN,
      near.longitude + BIAS_SPAN,
      near.latitude - BIAS_SPAN,
    ];
    url.searchParams.set("viewbox", box.join(","));
  }

  const response = await fetch(url.toString(), { headers: HEADERS });
  if (!response.ok) throw new Error(`Recherche d'adresse indisponible (${response.status})`);

  const data = (await response.json()) as NominatimResult[];

  return (Array.isArray(data) ? data : [])
    .map((result) => ({
      label: result.display_name ?? "",
      latitude: Number(result.lat),
      longitude: Number(result.lon),
    }))
    // Un résultat sans coordonnées lisibles ne mène nulle part : mieux vaut
    // l'écarter que de laisser un choix qui ne déplacera pas la carte.
    .filter(
      (place) =>
        place.label.length > 0 &&
        Number.isFinite(place.latitude) &&
        Number.isFinite(place.longitude),
    );
}
