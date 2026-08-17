import { INCIDENTS_PAGE_SIZE } from "@/constants/config";
import { getIncidents } from "@/services/incidents";
import type { IncidentResponse } from "@/types/incidents";
import { findDuplicates } from "@/utils/duplicates";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Attente avant d'interroger le serveur.
 *
 * Choisir une catégorie doit rester instantané. Sans ce délai, appuyer sur une
 * pastille lançait une requête, puis le décodage de cinquante signalements, sur
 * le fil qui tient l'écran — et le formulaire porte une carte, qui saccade à la
 * moindre occupation de ce fil. On laisse donc l'appui se terminer.
 */
const SETTLE_MS = 600;

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

    let alive = true;
    const timer = setTimeout(() => {
      // Marqué ici, et non à l'entrée de l'effet : la requête est différée, et
      // marquer avant de la lancer promettait un résultat qui n'arrivait jamais
      // si l'effet était démonté entre-temps. Le type restait alors noté comme
      // « déjà demandé » pour toute la vie de l'écran, et l'avertissement ne
      // reparaissait plus — reprendre un brouillon suffisait à le perdre.
      asked.current.add(type);
      void (async () => {
        try {
          const response = await getIncidents({ type, pageSize: INCIDENTS_PAGE_SIZE.load });
          if (alive) setByType((current) => ({ ...current, [type]: response.data }));
        } catch {
          // Sans réponse, pas d'avertissement. Le formulaire reste utilisable.
          asked.current.delete(type);
        }
      })();
    }, SETTLE_MS);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [type]);

  // Recalculé quand l'épingle bouge, et seulement alors : c'est ce qui fait
  // suivre l'avertissement, sans le recalculer à chaque lettre de la
  // description.
  const known = type ? byType[type] : undefined;
  return useMemo(
    () => findDuplicates(known ?? [], place, type),
    [known, type, place.latitude, place.longitude],
  );
}
