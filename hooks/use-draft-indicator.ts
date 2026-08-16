import { loadDraft } from "@/storage/report-draft";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";

/**
 * Y a-t-il un signalement commencé qui attend ?
 *
 * Le brouillon se restaure tout seul, mais rien ne le dit avant d'avoir ouvert
 * le formulaire : on peut très bien l'avoir oublié. Une pastille sur les boutons
 * « Signaler » suffit à s'en souvenir, et transforme une reprise silencieuse en
 * invitation.
 *
 * La lecture se fait au retour sur l'écran, jamais en continu : le brouillon ne
 * change que dans le formulaire, donc ailleurs, et c'est justement en revenant
 * qu'on a besoin de la réponse à jour.
 */
export function useHasDraft(): boolean {
  const [hasDraft, setHasDraft] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void loadDraft().then((draft) => {
        // L'écran a pu être quitté pendant la lecture : écrire dans un composant
        // démonté ne sert à rien et fait crier React.
        if (alive) setHasDraft(draft !== null);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  return hasDraft;
}
