import { useAppColors } from "@/hooks/use-app-colors";
import { RefreshControl } from "react-native";

type Props = {
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
 * Les écrans passaient `tintColor`, qui **n'existe que sur iOS**. Sur Android —
 * la seule plateforme qu'on distribue — la pastille tournait donc dans le bleu
 * par défaut du système, sur un disque blanc, au milieu d'une interface ocre :
 * le seul élément de l'application à ne pas être à sa charte. Android lit
 * `colors` et `progressBackgroundColor`.
 *
 * D'où ce composant plutôt qu'un correctif sur chaque écran : les quatre
 * propriétés doivent rester ensemble, et la prochaine liste qui apparaîtra les
 * aura sans y penser.
 */
export function AppRefreshControl({ refreshing, onRefresh, offset = 0 }: Props) {
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
