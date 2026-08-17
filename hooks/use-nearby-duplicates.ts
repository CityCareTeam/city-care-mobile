import { getIncidents } from "@/services/incidents";
import type { IncidentResponse } from "@/types/incidents";
import { findDuplicates } from "@/utils/duplicates";
import { useEffect, useRef, useState } from "react";

/** Assez pour couvrir une ville sur un type donné, sans ramener tout le fil. */
const PAGE_SIZE = 100;

/**
 * Signalements du même type déjà ouverts à deux pas.
 *
 * La recherche est faite côté serveur sur le type — c'est ce qui la rend
 * raisonnable, un seul type représente une fraction du fil — puis affinée à la
 * distance sur l'appareil, faute de filtre géographique dans l'API.
 *
 * Une requête par type choisi, gardée : revenir sur un type déjà consulté ne
 * redemande rien. L'utilisateur essaie souvent deux ou trois catégories avant de
 * se décider, et chacune aurait sinon coûté un aller-retour.
 *
 * Silencieux en cas d'échec : c'est une aide, pas une étape. Un réseau capricieux
 * ne doit pas empêcher de signaler — c'est précisément dehors, mal connecté,
 * qu'on en a besoin.
 */
export function useNearbyDuplicates(
  type: string | null,
  place: { latitude: number; longitude: number },
) {
  const [byType, setByType] = useState<Record<string, IncidentResponse[]>>({});
  const asked = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!type || asked.current.has(type)) return;
    asked.current.add(type);

    let alive = true;
    void (async () => {
      try {
        const response = await getIncidents({ type, pageSize: PAGE_SIZE });
        if (alive) setByType((current) => ({ ...current, [type]: response.data }));
      } catch {
        // Sans réponse, pas d'avertissement. Le formulaire reste utilisable.
        asked.current.delete(type);
      }
    })();

    return () => {
      alive = false;
    };
  }, [type]);

  // Recalculé à chaque déplacement de l'épingle : c'est le seul moyen que
  // l'avertissement suive la position choisie sur la carte.
  return findDuplicates(type ? (byType[type] ?? []) : [], place, type);
}
