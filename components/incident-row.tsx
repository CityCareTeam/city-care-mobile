import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { STATUS_COLOR, STATUS_LABEL, TYPE_COLOR, TYPE_ICON, TYPE_LABEL } from "@/constants/incidents";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import { extractCity } from "@/utils/format-address";
import { formatDateShort } from "@/utils/format-date";
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

function IncidentRowBase({ id, type, status, description, address, createdAt, onPress, isMine, isFollowed, onToggleFollow }: Props) {
  const { colors } = useAppColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useStrings();

  const statusColor = STATUS_COLOR[status] ?? "#999";
  const typeColor   = TYPE_COLOR[type]   ?? "#78909C";
  const typeIcon    = TYPE_ICON[type]    ?? "help-outline";
  const city        = extractCity(address);

  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(id)} activeOpacity={0.75}>
      <View style={[styles.stripe, { backgroundColor: statusColor }]} />
      <View style={styles.inner}>
      <View style={[styles.iconBubble, { backgroundColor: typeColor + "22" }]}>
        <MaterialIcons name={typeIcon} size={20} color={typeColor} />
      </View>
      <View style={styles.content}>
        <Text style={styles.type} numberOfLines={1}>{TYPE_LABEL[type] ?? type}</Text>
        {description ? (
          <Text style={styles.description} numberOfLines={1}>{description}</Text>
        ) : null}
        {city ? (
          <Text style={styles.address} numberOfLines={1}>{city}</Text>
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
        {/* Le signet n'était visible que dans la fiche : il fallait ouvrir un
            signalement pour savoir qu'on le suivait. Une icône suffit ici — la
            liste n'a pas la place d'un libellé de plus. */}
        {isFollowed && (
          onToggleFollow ? (
            <TouchableOpacity
              onPress={() => onToggleFollow(id)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t.incident.unfollowA11y}
            >
              <MaterialIcons name="bookmark" size={16} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <MaterialIcons name="bookmark" size={13} color={colors.primary} />
          )
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
