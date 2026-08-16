import { listDrafts } from "@/storage/report-draft";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";

/**
 * Combien de signalements commencés attendent ?
 *
 * Le brouillon se restaure tout seul, mais rien ne le dit avant d'avoir ouvert
 * le formulaire : on peut très bien l'avoir oublié. Une pastille sur les boutons
 * « Signaler » suffit à s'en souvenir, et transforme une reprise silencieuse en
 * invitation. Le compte, et non un simple oui/non : trois brouillons en attente
 * ne se racontent pas comme un seul.
 *
 * La lecture se fait au retour sur l'écran, jamais en continu : le brouillon ne
 * change que dans le formulaire, donc ailleurs, et c'est justement en revenant
 * qu'on a besoin de la réponse à jour.
 */
export function useDraftCount(): number {
  const [count, setCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void listDrafts().then((drafts) => {
        // L'écran a pu être quitté pendant la lecture : écrire dans un composant
        // démonté ne sert à rien et fait crier React.
        if (alive) setCount(drafts.length);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  return count;
}
