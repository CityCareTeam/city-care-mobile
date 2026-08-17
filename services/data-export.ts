import { API_BASE_URL } from "@/constants/api";
import { authFetch } from "@/services/api-client";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

/**
 * Export de ses propres données.
 *
 * Le pendant de la suppression de compte, qui existait déjà : pouvoir tout
 * effacer sans pouvoir rien consulter laissait le choix entre l'ignorance et la
 * table rase.
 *
 * Le fichier part dans le cache et non dans les documents : c'est une copie
 * qu'on transmet à une autre application — courriel, disque, messagerie — et
 * l'y garder indéfiniment ferait grossir l'application avec des exports que
 * personne ne relira. Le système fait le ménage quand il manque de place.
 */

/** Ce qui a pu échouer, dit assez précisément pour que l'écran le traduise. */
export type ExportOutcome = "shared" | "unavailable" | "failed";

function fileName(): string {
  // Date locale et non ISO : le nom se lit dans un gestionnaire de fichiers, et
  // « 2026-08-17 » y est plus utile qu'un horodatage à la milliseconde.
  const day = new Date().toISOString().slice(0, 10);
  return `citycare-mes-donnees-${day}.json`;
}

export async function exportMyData(token: string): Promise<ExportOutcome> {
  let payload: string;

  try {
    const response = await authFetch(`${API_BASE_URL}/users/me/export`, token);
    if (!response.ok) return "failed";
    // Réécrit indenté : un export qu'on ouvre dans un éditeur doit se lire, et
    // c'est la moitié de l'intérêt d'un JSON plutôt qu'un format opaque.
    payload = JSON.stringify(await response.json(), null, 2);
  } catch {
    return "failed";
  }

  try {
    const file = new File(Paths.cache, fileName());
    // Un export précédent du même jour traîne peut-être : on réécrit plutôt que
    // d'échouer sur un fichier existant.
    if (file.exists) file.delete();
    file.create();
    file.write(payload);

    // Sans feuille de partage — un émulateur nu, par exemple — le fichier est
    // écrit mais inatteignable. On le dit plutôt que d'annoncer un succès.
    if (!(await Sharing.isAvailableAsync())) return "unavailable";

    await Sharing.shareAsync(file.uri, {
      mimeType: "application/json",
      UTI: "public.json",
    });
    return "shared";
  } catch {
    return "failed";
  }
}
