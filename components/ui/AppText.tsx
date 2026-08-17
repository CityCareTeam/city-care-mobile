import { usePreferences } from "@/context/PreferencesContext";
import type { TextScale } from "@/storage/preferences";
import { useMemo } from "react";
import { StyleSheet, Text as RNText, type TextProps } from "react-native";

/**
 * Facteurs appliqués **par-dessus** l'échelle du système.
 *
 * `system` vaut un : le réglage d'accessibilité d'Android s'applique déjà à tout
 * le texte de l'application, et c'est lui qui doit rester la référence. Ce qui
 * suit n'existe que pour qui veut grossir l'application sans grossir son
 * téléphone entier.
 *
 * Deux crans seulement, et modestes. Au-delà d'un tiers en plus, les libellés de
 * la barre du bas, les badges de statut et les puces de filtre débordent de leurs
 * pastilles : un réglage d'accessibilité qui rend l'écran illisible n'aide
 * personne.
 */
const FACTORS: Record<TextScale, number> = {
  system: 1,
  large: 1.15,
  larger: 1.3,
};

/**
 * Taille par défaut de React Native, appliquée quand un style n'en fixe aucune.
 *
 * Sans elle, un texte sans `fontSize` resterait à sa taille d'origine pendant que
 * ses voisins grossissent — et l'écran perdrait sa hiérarchie au lieu de la
 * garder.
 */
const DEFAULT_FONT_SIZE = 14;

/**
 * Le `Text` de l'application.
 *
 * Il remplace celui de React Native dans tous les écrans — même nom, mêmes
 * propriétés, donc les trois cent vingt-cinq usages existants n'ont pas bougé,
 * seules les lignes d'import ont changé. C'est la seule façon d'appliquer une
 * échelle propre à l'application sans toucher les centaines de tailles écrites
 * en dur dans les feuilles de style.
 *
 * `lineHeight` grossit du même facteur quand elle est fixée : la laisser
 * derrière ferait se chevaucher les lignes d'un paragraphe agrandi.
 *
 * Le texte des composants tiers — la carte, les fenêtres du système — garde
 * l'échelle d'Android. C'est une limite assumée : on ne réécrit pas leur rendu.
 */
export function Text({ style, allowFontScaling, ...rest }: TextProps) {
  const { textScale } = usePreferences();

  /**
   * `allowFontScaling={false}` vaut aussi pour nous.
   *
   * C'est ce que demandent les étiquettes des épingles de la carte : elles sont
   * dessinées à l'intérieur d'une forme de taille fixe, et grossir le texte les
   * en ferait déborder. Un composant qui refuse l'échelle du système n'a pas de
   * raison d'accepter la nôtre.
   */
  const factor = allowFontScaling === false ? 1 : (FACTORS[textScale] ?? 1);

  const scaled = useMemo(() => {
    // Le cas de loin le plus fréquent : rien à recalculer, et le style passe tel
    // quel sans allocation supplémentaire.
    if (factor === 1) return style;

    const flat = StyleSheet.flatten(style) ?? {};
    const size = typeof flat.fontSize === "number" ? flat.fontSize : DEFAULT_FONT_SIZE;
    const lineHeight = typeof flat.lineHeight === "number" ? flat.lineHeight * factor : undefined;

    return [style, { fontSize: size * factor, ...(lineHeight ? { lineHeight } : null) }];
  }, [style, factor]);

  return <RNText style={scaled} allowFontScaling={allowFontScaling} {...rest} />;
}
