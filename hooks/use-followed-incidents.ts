import { listFollowed, toggleFollowed } from "@/storage/followed-incidents";
import { tapped } from "@/utils/feedback";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";

/**
 * Suivi local des signalements.
 *
 * L'ensemble est tenu en mémoire pour que chaque ligne puisse demander « suis-je
 * suivi ? » sans lire le disque : une liste de cinquante incidents poserait la
 * question cinquante fois par rendu.
 *
 * Relu à l'arrivée sur l'écran, parce que le suivi se bascule ailleurs — dans la
 * fiche d'un incident, ouverte depuis la carte.
 */
export function useFollowedIncidents() {
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    setFollowed(new Set(await listFollowed()));
  }, []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void listFollowed().then((ids) => {
        if (alive) setFollowed(new Set(ids));
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const toggle = useCallback(async (id: string) => {
    // Au moment du geste : l'état local suit dans la foulée, l'utilisateur n'a
    // pas à attendre le disque pour savoir qu'il a été entendu.
    tapped();
    const nowFollowed = await toggleFollowed(id);
    setFollowed((previous) => {
      const next = new Set(previous);
      if (nowFollowed) next.add(id);
      else next.delete(id);
      return next;
    });
    return nowFollowed;
  }, []);

  return { followed, toggle, refresh };
}
