import { STATUS_COLOR, STATUS_LABEL } from "@/constants/incidents";
import type { AppColors } from "@/hooks/use-app-colors";
import type { NotificationResponse } from "@/types/notifications";
import { timeAgo } from "@/utils/format-date";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

type IconConfig = {
  name: React.ComponentProps<typeof MaterialIcons>["name"];
  bg: string;
  color: string;
};

function getIconConfig(type: string): IconConfig {
  switch (type) {
    case "new_incident":
      return { name: "add-location-alt", bg: "#f6aa5420", color: "#f6aa54" };
    case "incident_status_changed":
      return { name: "autorenew", bg: "#1D9BF020", color: "#1D9BF0" };
    case "new_message":
      return { name: "chat-bubble", bg: "#4caf5020", color: "#4caf50" };
    default:
      return { name: "notifications", bg: "#AF52DE20", color: "#AF52DE" };
  }
}

/**
 * Retrouve le statut à partir du texte du message. Le back envoie
 * « Votre signalement est maintenant {statut}. » sans champ dédié — on
 * redevine donc une valeur qu'il possédait déjà. Fragile par nature : si le
 * libellé change, le badge disparaît sans bruit.
 */
function extractStatusKey(type: string, body: string): string | null {
  if (type !== "incident_status_changed") return null;
  const lower = body.toLowerCase();
  if (lower.includes("en cours")) return "in_progress";
  if (lower.includes("résolu")) return "resolved";
  if (lower.includes("déclaré")) return "reported";
  return null;
}

type Props = {
  item: NotificationResponse;
  styles: ReturnType<typeof makeRowStyles>;
  onPress: (item: NotificationResponse) => void;
  onDelete: (id: string) => void;
};

function NotificationRowBase({ item, styles, onPress, onDelete }: Props) {
  const icon = getIconConfig(item.type);
  const statusKey = extractStatusKey(item.type, item.body ?? "");
  const statusColor = statusKey ? STATUS_COLOR[statusKey] : null;
  const statusLabel = statusKey ? STATUS_LABEL[statusKey] : null;
  const stripeColor = item.is_read ? icon.color + "50" : icon.color;

  return (
    <Swipeable
      overshootRight={false}
      // Pas de suppression à l'ouverture : le glissement révèle la corbeille,
      // c'est l'appui dessus qui supprime. Sinon un glissement involontaire
      // effaçait une notification sans confirmation ni retour possible — et le
      // bouton révélé n'était jamais atteignable.
      renderRightActions={() => (
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => onDelete(item.id)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Supprimer la notification : ${item.title}`}
        >
          <MaterialIcons name="delete-outline" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    >
      <TouchableOpacity style={styles.item} onPress={() => onPress(item)} activeOpacity={0.8}>
        {!item.is_read && <View style={[styles.unreadStripe, { backgroundColor: stripeColor }]} />}
        <View style={styles.inner}>
          <View style={[styles.iconBubble, { backgroundColor: item.is_read ? icon.bg + "88" : icon.bg }]}>
            <MaterialIcons
              name={icon.name}
              size={20}
              color={item.is_read ? icon.color + "88" : icon.color}
            />
          </View>
          <View style={styles.itemContent}>
            <Text style={[styles.itemTitle, item.is_read && styles.itemTitleRead]} numberOfLines={1}>
              {item.title}
            </Text>
            {item.body ? (
              <Text style={styles.itemBody} numberOfLines={1}>{item.body}</Text>
            ) : null}
            <Text style={[styles.itemTime, item.is_read && styles.itemTimeRead]}>
              {timeAgo(item.created_at)}
            </Text>
          </View>
          <View style={styles.right}>
            {statusColor && statusLabel && (
              <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
                <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            )}
            {item.type === "new_message" && (item.message_count ?? 0) > 1 && (
              <View style={styles.msgCountBadge}>
                <Text style={styles.msgCountText}>{item.message_count}</Text>
              </View>
            )}
            {item.incident_id && <Text style={styles.chevron}>›</Text>}
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

// La liste se re-rend à chaque sondage : sans mémoïsation, les cinquante
// lignes et leurs détecteurs de gestes seraient reconstruits toutes les 30 s.
export const NotificationRow = memo(NotificationRowBase);

export function makeRowStyles(c: AppColors) {
  return StyleSheet.create({
    item: {
      borderRadius: 16,
      backgroundColor: c.white,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    deleteAction: {
      justifyContent: "center",
      alignItems: "center",
      width: 72,
      borderTopRightRadius: 16,
      borderBottomRightRadius: 16,
      backgroundColor: "#e53e3e",
      marginLeft: 6,
    },
    inner: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 14,
      gap: 12,
    },
    unreadStripe: {
      position: "absolute",
      left: 0, top: 0, bottom: 0,
      width: 3, borderTopLeftRadius: 16, borderBottomLeftRadius: 16,
    },
    iconBubble: {
      width: 42, height: 42, borderRadius: 13,
      alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    itemContent: { flex: 1, minWidth: 0 },
    itemTitle: { fontSize: 14, fontWeight: "700", color: c.text, marginBottom: 2 },
    itemTitleRead: { fontWeight: "500", opacity: 0.55 },
    itemBody: { fontSize: 12, color: c.text, opacity: 0.5, marginBottom: 3 },
    itemTime: { fontSize: 11, fontWeight: "500", color: c.primary, opacity: 0.8 },
    itemTimeRead: { color: c.text, opacity: 0.3 },
    right: { alignItems: "flex-end", gap: 6, flexShrink: 0 },
    statusBadge: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4 },
    statusBadgeText: { fontSize: 11, fontWeight: "700" },
    msgCountBadge: {
      backgroundColor: "#4caf50",
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    msgCountText: { fontSize: 11, fontWeight: "700", color: "#fff" },
    chevron: { fontSize: 18, color: c.text, opacity: 0.2, lineHeight: 20 },
  });
}
