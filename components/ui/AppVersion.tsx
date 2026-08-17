import { useRunningUpdate } from "@/hooks/use-app-update";
import { useAppColors } from "@/hooks/use-app-colors";
import { baseVersion, buildLabel, releaseTag } from "@/utils/app-version";
import { Fragment, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/AppText";

/**
 * Version de l'application, suivie du badge de canal sur les builds hors
 * production.
 *
 * Le numéro affiché est débarrassé de son suffixe : sur `1.5.6-beta.3`, le badge
 * dit déjà « BETA », le répéter dans le numéro n'apprend rien. En production il
 * n'y a ni suffixe ni badge — un utilisateur final n'a pas à se demander ce
 * qu'est une « beta ».
 *
 * Le rang du build vit *dans* la pastille, derrière un filet :
 *
 *     v1.5.6  ( ● BETA │ #3 )
 *
 * Posé à côté, il flottait — un « 3 » orphelin entre deux blancs, qu'on lisait
 * comme une note de bas de page plutôt que comme le numéro de la beta qu'on a
 * sous les yeux. Segmenté, il appartient visiblement au canal qu'il numérote.
 *
 * Un troisième segment s'ajoute lorsqu'une mise à jour à la volée a remplacé le
 * bundle livré avec l'APK :
 *
 *     v1.5.6  ( ● BETA │ #3 │ a1b2c3d4 )
 *
 * Depuis l'OTA, le rang de build ne suffit plus à dire ce qui tourne : deux
 * appareils portant la même beta #3 peuvent exécuter deux JS différents. Le
 * segment ne paraît que dans ce cas — sur un APK fraîchement installé il n'y a
 * rien à distinguer, et l'afficher quand même n'aurait été que du bruit.
 */

/**
 * Un rang se donne à lire comme tel : `#3`. Un repère nommé (`fix-clusters`)
 * se suffit à lui-même et reste nu.
 */
function decorate(label: string): string {
  return /^\d+$/.test(label) ? `#${label}` : label;
}

export function AppVersion() {
  const { colors, isDark } = useAppColors();
  const styles = useMemo(() => makeStyles(isDark), [isDark]);

  // Le canal vient de la config, pas de la chaîne de version : c'est lui qui
  // fait foi. Le découpage numéro / repère est mutualisé dans `utils`.
  const tag = releaseTag();
  const base = baseVersion();
  const label = buildLabel();
  const update = useRunningUpdate();

  // Les segments qui suivent le canal, dans l'ordre où on les lit : d'abord quel
  // binaire, ensuite quel JS tourne dessus.
  const segments = [label !== "" ? decorate(label) : null, update !== "" ? update : null]
    .filter((seg): seg is string => seg !== null);

  return (
    <View
      style={styles.row}
      accessibilityRole="text"
      accessibilityLabel={
        tag
          ? `Version ${base}, version d'essai ${tag}${label ? `, build ${label}` : ""}` +
            (update ? `, mise à jour ${update}` : "")
          : `Version ${base}`
      }
    >
      <Text style={[styles.version, { color: colors.text }]}>v{base}</Text>
      {tag && (
        <View
          testID="release-badge"
          style={[
            styles.badge,
            { backgroundColor: colors.primary + "1F", borderColor: colors.primary + "4D" },
          ]}
        >
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.badgeText, { color: colors.primary }]}>
            {tag.toUpperCase()}
          </Text>
          {segments.map((segment) => (
            <Fragment key={segment}>
              <View style={[styles.divider, { backgroundColor: colors.primary + "40" }]} />
              <Text style={[styles.label, { color: colors.primary }]}>{segment}</Text>
            </Fragment>
          ))}
        </View>
      )}
    </View>
  );
}

function makeStyles(isDark: boolean) {
  return StyleSheet.create({
    row: {
      marginTop: 24,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    version: {
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: 0.2,
      opacity: isDark ? 0.35 : 0.3,
      fontVariant: ["tabular-nums"],
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderRadius: 999,
      borderWidth: 1,
      paddingLeft: 7,
      paddingRight: 8,
      paddingVertical: 3,
    },
    dot: { width: 5, height: 5, borderRadius: 2.5 },
    // Filet de séparation du second segment. Il monte sur toute la hauteur du
    // contenu — `stretch` l'emporte sur le `center` de la pastille — et déborde
    // d'un point dans le rembourrage : un trait plus court que le texte se lit
    // comme une virgule, pas comme une césure.
    divider: {
      width: 1,
      alignSelf: "stretch",
      marginVertical: -1,
    },
    // Rang du build : présent pour qui le cherche, en retrait pour les autres.
    // Il tient la couleur du canal, l'opacité seule le fait passer au second
    // plan — un gris franc l'aurait détaché de la pastille qui le porte.
    label: {
      fontSize: 9,
      fontWeight: "700",
      letterSpacing: 0.2,
      opacity: isDark ? 0.78 : 0.72,
      fontVariant: ["tabular-nums"],
    },
    badgeText: {
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 0.8,
    },
  });
}
