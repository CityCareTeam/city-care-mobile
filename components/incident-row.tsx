import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { STATUS_COLOR, STATUS_LABEL, TYPE_COLOR, TYPE_ICON, TYPE_LABEL } from "@/constants/incidents";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import { extractCity } from "@/utils/format-address";
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
    content: { flex: 1, minWidth: 0 },
    type: {
      fontSize: 14,
      fontWeight: "700",
      color: c.text,
      marginBottom: 2,
    },
    description: {
      fontSize: 12,
      color: c.text,
      opacity: 0.6,
      marginBottom: 2,
      fontStyle: "italic",
    },
    address: {
      fontSize: 11,
      color: c.text,
      opacity: 0.4,
    },
    date: {
      fontSize: 11,
      color: c.primary,
      opacity: 0.7,
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
  const city        = extractCity(address);
  // « Villeurbanne · 1,2 km » : où c'est, puis à quelle distance. Les deux
  // répondent à la même question et tiennent sur la même ligne.
  const away        = distanceKm === undefined ? "" : formatDistance(distanceKm, t.locale);
  const place       = [city, away].filter(Boolean).join(" · ");

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
        <Text style={styles.type} numberOfLines={1}>{TYPE_LABEL[type] ?? type}</Text>
        {description ? (
          <Text style={styles.description} numberOfLines={1}>{description}</Text>
        ) : null}
        {place ? (
          <Text style={styles.address} numberOfLines={1}>{place}</Text>
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
