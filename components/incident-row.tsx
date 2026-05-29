import { STATUS_COLOR, STATUS_LABEL, TYPE_LABEL } from "@/constants/incidents";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { formatDateShort } from "@/utils/format-date";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  id: string;
  type: string;
  status: string;
  address: string | null | undefined;
  createdAt: string;
  onPress: (id: string) => void;
};

function makeStyles(c: AppColors) {
  return StyleSheet.create({
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
      color: c.text,
      marginBottom: 2,
    },
    address: { fontSize: 12, color: c.text, opacity: 0.55 },
    badge: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4 },
    badgeText: { fontSize: 11, fontWeight: "700" },
  });
}

export function IncidentRow({ id, type, status, address, createdAt, onPress }: Props) {
  const { colors } = useAppColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
          {formatDateShort(createdAt)} · {address || "Adresse inconnue"}
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
