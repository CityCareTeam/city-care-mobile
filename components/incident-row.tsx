import { STATUS_COLOR, STATUS_LABEL, TYPE_LABEL } from "@/constants/incidents";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { extractCity, formatDateShort } from "@/utils/format-date";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  id: string;
  type: string;
  status: string;
  description?: string;
  address: string | null | undefined;
  createdAt: string;
  onPress: (id: string) => void;
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
      paddingVertical: 14,
      paddingHorizontal: 14,
      gap: 12,
    },
    content: { flex: 1 },
    type: {
      fontSize: 14,
      fontWeight: "700",
      color: c.text,
      marginBottom: 3,
    },
    description: {
      fontSize: 12,
      color: c.text,
      opacity: 0.7,
      marginBottom: 2,
      fontStyle: "italic",
    },
    address: {
      fontSize: 12,
      color: c.text,
      opacity: 0.45,
      marginBottom: 2,
    },
    date: {
      fontSize: 11,
      color: c.text,
      opacity: 0.35,
      fontWeight: "500",
    },
    right: {
      alignItems: "flex-end",
      gap: 6,
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
    chevron: {
      fontSize: 18,
      color: c.text,
      opacity: 0.2,
      lineHeight: 20,
    },
  });
}

export function IncidentRow({ id, type, status, description, address, createdAt, onPress }: Props) {
  const { colors } = useAppColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const color = STATUS_COLOR[status] ?? "#999";

  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(id)} activeOpacity={0.75}>
      <View style={[styles.stripe, { backgroundColor: color }]} />
      <View style={styles.inner}>
        <View style={styles.content}>
          <Text style={styles.type}>{TYPE_LABEL[type] ?? type}</Text>
          {description && (
            <Text style={styles.description} numberOfLines={1}>
              {description.length > 30 ? `${description.slice(0, 30)}…` : description}
            </Text>
          )}
          <Text style={styles.address} numberOfLines={1}>
            {extractCity(address)}
          </Text>
          <Text style={styles.date}>{formatDateShort(createdAt)}</Text>
        </View>
        <View style={styles.right}>
          <View style={[styles.badge, { backgroundColor: color + "20" }]}>
            <Text style={[styles.badgeText, { color }]}>
              {STATUS_LABEL[status] ?? status}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
