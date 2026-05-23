import { STATUS_COLOR, STATUS_LABEL, TYPE_LABEL } from "@/constants/incidents";
import { CityCareColors } from "@/constants/theme";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  id: string;
  type: string;
  status: string;
  address: string | null | undefined;
  onPress: (id: string) => void;
};

export function IncidentRow({ id, type, status, address, onPress }: Props) {
  const color = STATUS_COLOR[status] ?? "#999";
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress(id)}
      activeOpacity={0.75}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.content}>
        <Text style={styles.type}>{TYPE_LABEL[type] ?? type}</Text>
        <Text style={styles.address} numberOfLines={1}>
          {address || "Adresse inconnue"}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: color + "20" }]}>
        <Text style={[styles.badgeText, { color }]}>
          {STATUS_LABEL[status] ?? status}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 12,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  content: { flex: 1 },
  type: {
    fontSize: 14,
    fontWeight: "700",
    color: CityCareColors.text,
    marginBottom: 2,
  },
  address: { fontSize: 12, color: CityCareColors.text, opacity: 0.55 },
  badge: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "700" },
});
