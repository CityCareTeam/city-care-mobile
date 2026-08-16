import { useAppColors } from "@/hooks/use-app-colors";
import { RefreshControl } from "react-native";

type Options = {
  refreshing: boolean;
  onRefresh: () => void;
  /**
   * Hauteur à laquelle la pastille descend. Sans elle, elle apparaît en haut du
   * défilement — c'est-à-dire sous la barre d'état, à moitié coupée.
   */
  offset?: number;
};

/**
 * Tiré-pour-rafraîchir aux couleurs de l'application.
 *
 * Les écrans ne passaient que `tintColor`, qui **n'existe que sur iOS**. Sur
 * Android — la seule plateforme qu'on distribue — la pastille tournait donc dans
 * le bleu par défaut du système, sur un disque blanc, au milieu d'une interface
 * ocre : le seul élément de l'application à ne pas être à sa charte. Android lit
 * `colors` et `progressBackgroundColor`.
 *
 * ⚠️ **Un crochet, et surtout pas un composant.** `ScrollView` ne rend pas
 * l'élément qu'on lui donne en `refreshControl` : il le *clone* en lui passant
 * tout le contenu de l'écran comme enfants (`ScrollView.js:1838`). Un composant
 * intermédiaire recevrait donc ces enfants et, s'il ne les transmet pas — ce
 * qu'un composant n'a aucune raison de faire — l'écran entier disparaît. Ce
 * qu'on avait : deux écrans noirs. Le crochet rend un vrai `RefreshControl`,
 * c'est lui que `ScrollView` clone, et le contenu retrouve sa place.
 *
 * À appeler avant tout retour anticipé de l'écran, comme n'importe quel crochet.
 */
export function useAppRefreshControl({ refreshing, onRefresh, offset = 0 }: Options) {
  const { colors } = useAppColors();

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      // iOS
      tintColor={colors.primary}
      // Android — un tableau, la pastille peut cycler sur plusieurs teintes.
      // Une seule suffit : c'est un chargement, pas une animation.
      colors={[colors.primary]}
      // Le disque qui porte la pastille. En sombre, le blanc du système faisait
      // une lune dans un ciel noir ; `white` est ici la couleur de surface du
      // thème, pas du blanc.
      progressBackgroundColor={colors.white}
      progressViewOffset={offset}
    />
  );
}
