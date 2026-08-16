import { Redirect, useLocalSearchParams } from "expo-router";

/**
 * Point d'entrée des liens partagés — `citycaremobile://incident/<id>`.
 *
 * Cette route n'affiche rien : elle traduit une adresse publique, faite pour
 * être collée dans un message, en la navigation interne qui existait déjà
 * (`explore` sait ouvrir un incident par `selectId`). Refaire ici l'écran de
 * détail aurait donné deux chemins vers la même vue, à tenir tous les deux.
 *
 * Un identifiant absent renvoie à la carte plutôt qu'à une erreur : un lien
 * tronqué par une messagerie doit ouvrir quelque chose.
 */
export default function SharedIncidentRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  return (
    <Redirect
      href={id ? { pathname: "/(tabs)/explore", params: { selectId: id } } : "/(tabs)/explore"}
    />
  );
}
