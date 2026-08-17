import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { STATUS_COLOR, STATUS_LABEL, TYPE_COLOR, TYPE_ICON, TYPE_LABEL } from "@/constants/incidents";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import { extractCity, UNKNOWN_CITY } from "@/utils/format-address";
import { formatDateShort } from "@/utils/format-date";
import { formatDistance } from "@/utils/format-distance";
import { memo, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  id: string;
  type: string;
  status: string;
  description?: string;
  address: string | null | undefined;
  createdAt: string;
  onPress: (id: string) => void;
  isMine?: boolean;
  /** Suivi localement : le signet doit se voir dans la liste, pas seulement dans la fiche. */
  isFollowed?: boolean;
  /**
   * Fourni, le signet devient un bouton : retirer un suivi ne demande plus
   * d'ouvrir la fiche. C'est le geste que l'on refait le plus dans une liste de
   * favoris — le rendre indirect la rendait pénible à tenir.
   */
  onToggleFollow?: (id: string) => void;
  /**
   * Distance depuis l'utilisateur, en kilomètres. Absente tant qu'on ne connaît
   * pas sa position — et on ne la réclame que s'il trie par proximité.
   *
   * Sans elle, l'ordre de la liste disait qu'un signalement était le plus
   * proche, jamais s'il était à deux rues ou à dix kilomètres.
   */
  distanceKm?: number;
};


function makeStyles(c: AppColors) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "stretch",
      overflow: "hidden",
    },
    stripe: {
      width: 4,
    },
    inner: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 14,
      gap: 12,
    },
    // Une pastille qui mord sur le coin de la bulle : elle appartient à la
    // ligne sans lui prendre de largeur.
    bookmark: {
      position: "absolute",
      top: -5,
      left: -5,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: c.white,
    },
    iconBubble: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    content: { flex: 1, minWidth: 0, gap: 3 },
    // Deux lignes autorisées : une description tronquée à mi-mot ne renseigne
    // pas, et c'est elle qu'on lit pour choisir sur quelle ligne appuyer. La
    // hauteur varie d'une ligne à l'autre, ce qu'une liste séparée par des
    // filets supporte sans peine.
    title: {
      fontSize: 14,
      fontWeight: "700",
      color: c.text,
      lineHeight: 19,
    },
    // La transparence est dans la couleur, pas dans `opacity` : celle-ci
    // s'applique à tout le sous-arbre et aurait délavé la distance en orange
    // avec le reste.
    meta: {
      fontSize: 11.5,
      color: c.text + "73",
    },
    // La distance est la seule chose ici qui dépende de l'endroit où l'on se
    // tient : elle mérite d'être trouvée sans être cherchée.
    away: {
      color: c.primary,
      fontWeight: "800",
    },
    // Neutre, et non en couleur d'accent : la ligne porte déjà une bulle de
    // catégorie colorée et un badge de statut coloré. Une date orange y faisait
    // une troisième couleur sans rien signifier de plus — et se lisait comme un
    // lien.
    date: {
      fontSize: 11,
      color: c.text,
      opacity: 0.4,
      fontWeight: "600",
    },
    right: {
      alignItems: "flex-end",
      gap: 6,
      flexShrink: 0,
    },
    badge: {
      borderRadius: 12,
      paddingHorizontal: 9,
      paddingVertical: 4,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: "700",
    },
    mineBadge: {
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 3,
      backgroundColor: c.primary,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    mineBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#fff",
    },
  });
}

function IncidentRowBase({ id, type, status, description, address, createdAt, onPress, isMine, isFollowed, onToggleFollow, distanceKm }: Props) {
  const { colors } = useAppColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useStrings();

  const statusColor = STATUS_COLOR[status] ?? "#999";
  const typeColor   = TYPE_COLOR[type]   ?? "#78909C";
  const typeIcon    = TYPE_ICON[type]    ?? "help-outline";
  const typeLabel   = TYPE_LABEL[type]   ?? type;

  const city = extractCity(address);
  // On préfère taire la localisation qu'annoncer qu'on l'ignore : « Localisation
  // inconnue » occupait une ligne pour ne rien dire.
  const knownCity = city === UNKNOWN_CITY ? "" : city;
  const away = distanceKm === undefined ? "" : formatDistance(distanceKm, t.locale);

  /**
   * La description en tête, la catégorie en dessous — et non l'inverse.
   *
   * Le titre d'une ligne doit être ce qui la distingue de sa voisine. C'était la
   * catégorie : dix lignes de suite intitulées « Voirie », sous dix icônes
   * identiques qui le disaient déjà, tandis que la seule information propre à
   * chacune — la description — passait en italique tronqué à une ligne.
   *
   * Sans description, la catégorie reprend la place du titre : mieux vaut la
   * répéter que laisser une ligne sans nom.
   */
  const written = description?.trim();
  const title = written || typeLabel;
  // La distance reste à part : elle se colore, le reste non.
  const context = [written ? typeLabel : "", knownCity].filter(Boolean).join(" · ");

  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(id)} activeOpacity={0.75}>
      <View style={[styles.stripe, { backgroundColor: statusColor }]} />
      <View style={styles.inner}>
      <View>
        <View style={[styles.iconBubble, { backgroundColor: typeColor + "22" }]}>
          <MaterialIcons name={typeIcon} size={20} color={typeColor} />
        </View>
        {/* Posé sur la bulle plutôt que dans la colonne de droite, où le statut,
            « le mien » et la date se disputaient déjà la place. En haut à
            gauche, il est le premier élément que l'œil rencontre en parcourant
            la liste — et c'est bien ce qu'on cherche à repérer. */}
        {isFollowed && (
          onToggleFollow ? (
            <TouchableOpacity
              style={styles.bookmark}
              onPress={() => onToggleFollow(id)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t.incident.unfollowA11y}
            >
              <MaterialIcons name="bookmark" size={12} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={styles.bookmark}>
              <MaterialIcons name="bookmark" size={12} color="#fff" />
            </View>
          )
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {context || away ? (
          <Text style={styles.meta} numberOfLines={1}>
            {context}
            {away ? (
              <Text style={styles.away}>{context ? ` · ${away}` : away}</Text>
            ) : null}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>
        <View style={[styles.badge, { backgroundColor: statusColor + "20" }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {STATUS_LABEL[status] ?? status}
          </Text>
        </View>
        {isMine && (
          <View style={styles.mineBadge}>
            <MaterialIcons name="person" size={10} color="#fff" />
            <Text style={styles.mineBadgeText}>{t.incident.mine}</Text>
          </View>
        )}
        <Text style={styles.date}>{formatDateShort(createdAt)}</Text>
      </View>
      </View>
    </TouchableOpacity>
  );
}

// La liste se re-rend à chaque sondage : sans mémoïsation, toutes les lignes
// visibles seraient reconstruites toutes les quinze secondes pour rien.
export const IncidentRow = memo(IncidentRowBase);
