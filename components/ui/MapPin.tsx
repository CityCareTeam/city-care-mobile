import { TYPE_ICON } from "@/constants/incidents";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Platform, Text, View } from "react-native";

// react-native-maps rasterise la vue du marker dans un bitmap Android. Une
// seule construction s'est avérée rendre correctement, et les trois formes
// d'ici s'y tiennent à la lettre :
//
//   1. Exactement trois enfants, tous en `position: absolute` sur un conteneur
//      de taille fixe calculée. Au-delà, les derniers ne sont plus dessinés.
//   2. Des formes PLEINES empilées — jamais de `borderWidth` pour un liseré,
//      jamais d'aplat translucide par-dessus. C'est ce qui produisait les
//      croissants et les cercles rognés.
//   3. Rien ne déborde du conteneur : tout ce qui dépasse est rogné.

/** Distance centre → pointe d'un carré de côté S pivoté de 45°. */
const TIP_RATIO = Math.SQRT1_2; // ≈ 0.7071

/**
 * Toutes les formes restent dans le gabarit de l'épingle au repos (30×40), seul
 * dont on ait la preuve qu'il se rasterise intégralement, pointe comprise. Au
 * fur et à mesure qu'on s'en écarte le bas de la larme se perd : la pointe
 * disparaît vers 38×49, la forme entière devient un carré arrondi vers 46×56.
 * D'où une taille de pastille unique — c'est le chiffre qui porte l'ampleur,
 * pas l'échelle.
 */
const CLUSTER_BODY = 34;

/**
 * Marge laissée sous la pointe. Collée au bord du conteneur, elle disparaissait
 * à la capture : la dernière rangée de pixels ne survit pas à la mise à
 * l'échelle par la densité de l'écran. L'ancrage est recalculé pour que la
 * coordonnée reste sur la pointe et non sur le bas du conteneur.
 */
const TIP_PAD = 3;

const PIN_BODY = { rest: 30, active: 34 } as const;

/**
 * Ombre réservée à iOS. Sur Android, une vue qui porte une ombre voit son
 * contour calculé par `ViewOutlineProvider`, lequel ne sait pas représenter des
 * rayons de coin différents : il approxime par un rectangle à rayon uniforme et
 * rabote donc le coin pointu de la larme — d'autant plus que la forme est
 * grande. Aucune perte visuelle réelle, l'ombre ne survivait de toute façon pas
 * à la rasterisation du marker.
 */
const SHADOW = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  default: {},
});

/**
 * Géométrie commune : un carré de côté `body` pivoté de 45° donne une larme
 * dont la pointe tombe à `body / √2` sous le centre de la tête. Le conteneur
 * ajoute `TIP_PAD` en dessous ; l'ancre correspondante est `anchorOf(body)`.
 */
function layout(body: number) {
  const width = body;
  const tipY = body / 2 + body * TIP_RATIO;
  const height = Math.ceil(tipY) + TIP_PAD;
  return { width, height, cx: width / 2, cy: body / 2, tipY };
}

/** Ancre le marker sur la pointe de la larme, marge du bas exclue. */
function anchorOf(body: number) {
  const { height, tipY } = layout(body);
  return { x: 0.5, y: tipY / height };
}

export const MAP_PIN_ANCHOR = {
  rest: anchorOf(PIN_BODY.rest),
  active: anchorOf(PIN_BODY.active),
} as const;

export const CLUSTER_PIN_ANCHOR = anchorOf(CLUSTER_BODY);

/** Carré à trois coins arrondis, pivoté — la larme. */
function teardrop(size: number, tipRadius: number) {
  return {
    width: size,
    height: size,
    borderTopLeftRadius: size / 2,
    borderTopRightRadius: size / 2,
    borderBottomLeftRadius: size / 2,
    borderBottomRightRadius: tipRadius,
    transform: [{ rotate: "45deg" }],
  };
}

function centered(cx: number, cy: number, size: number) {
  return {
    position: "absolute" as const,
    left: cx - size / 2,
    top: cy - size / 2,
  };
}

type PinProps = {
  color: string;
  /** Type d'incident — affiche l'icône correspondante dans la goutte. */
  type?: string;
  active?: boolean;
};

/**
 * Goutte : larme blanche pleine, larme colorée par-dessus, contenu redressé.
 * L'état sélectionné ne change que l'échelle et l'épaisseur du liseré — pas de
 * halo, qui est justement ce qui ne se rasterise pas.
 */
export function MapPin({ color, type, active = false }: PinProps) {
  const body = active ? PIN_BODY.active : PIN_BODY.rest;
  const ring = active ? 3 : 2.5;
  const core = body - ring * 2;

  const { width, height, cx, cy } = layout(body);
  const iconSize = Math.round(core * 0.62);
  const dot = Math.round(core * 0.36);

  const iconName = type ? TYPE_ICON[type] : undefined;

  return (
    <View collapsable={false} style={{ width, height }}>
      <View
        collapsable={false}
        style={{
          ...centered(cx, cy, body),
          ...teardrop(body, 2),
          backgroundColor: "#fff",
          ...SHADOW,
        }}
      />
      <View
        collapsable={false}
        style={{
          ...centered(cx, cy, core),
          ...teardrop(core, 1),
          backgroundColor: color,
        }}
      />
      <View
        collapsable={false}
        pointerEvents="none"
        style={{
          ...centered(cx, cy, core),
          width: core,
          height: core,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {iconName ? (
          <MaterialIcons name={iconName} size={iconSize} color="#fff" />
        ) : (
          <View
            collapsable={false}
            style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: "#fff" }}
          />
        )}
      </View>
    </View>
  );
}

type ClusterPinProps = {
  count: number;
  color: string;
};

/**
 * Pastille : la même larme, avec le compteur à la place de l'icône. Carte
 * groupée et carte détaillée partagent ainsi une seule forme, et la pointe
 * désigne le centroïde de la cellule comme une épingle désigne son
 * signalement. Taille unique — c'est le chiffre qui porte l'ampleur.
 */
export function ClusterPin({ count, color }: ClusterPinProps) {
  const body = CLUSTER_BODY; // taille unique — voir CLUSTER_BODY
  const ring = 3;
  const core = body - ring * 2;

  const { width, height, cx, cy } = layout(body);

  const label = count > 999 ? "999+" : String(count);
  const fontSize = label.length <= 2 ? 16 : label.length === 3 ? 13 : 11;

  return (
    <View collapsable={false} style={{ width, height, alignItems: "center" }}>
      <View
        collapsable={false}
        style={{
          ...centered(cx, cy, body),
          ...teardrop(body, 2),
          backgroundColor: "#fff",
          ...SHADOW,
        }}
      />
      <View
        collapsable={false}
        style={{
          ...centered(cx, cy, core),
          ...teardrop(core, 1),
          backgroundColor: color,
        }}
      />
      {/* Le compteur est un enfant de FLUX, pas en absolu : c'est la seule
          disposition dont on ait la preuve qu'Android rasterise le texte d'un
          marker. `marginTop` le recale sur le centre de la tête. */}
      <View
        collapsable={false}
        pointerEvents="none"
        style={{
          marginTop: cy - core / 2,
          width: core,
          height: core,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          allowFontScaling={false}
          style={{ color: "#fff", fontWeight: "800", fontSize, letterSpacing: -0.3 }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}
