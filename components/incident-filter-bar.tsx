import { STATUS_COLOR, STATUS_LABEL, TYPE_LABEL } from "@/constants/incidents";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { useMemo } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type Props = {
  filterStatus: string | null;
  setFilterStatus: (v: string | null) => void;
  filterType: string | null;
  setFilterType: (v: string | null) => void;
  onRefresh?: () => void;
  loading?: boolean;
  paddingTop?: number;
};

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    bar: {
      gap: 5,
      paddingBottom: 6,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingRight: 12,
    },
    row: {
      paddingHorizontal: 12,
      gap: 6,
      flexDirection: "row",
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: c.chipBg,
      borderWidth: 1.5,
      borderColor: c.chipBorder,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 3,
      elevation: 3,
      gap: 5,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    chipText: {
      fontSize: 12,
      fontWeight: "600",
      color: c.text,
    },
    chipActiveOrange: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    chipTextActive: {
      color: "#fff",
    },
    refreshBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.primary,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
      marginLeft: 4,
      flexShrink: 0,
    },
    refreshBtnDisabled: { opacity: 0.55 },
    refreshIcon: { fontSize: 18, color: "#fff", fontWeight: "700" },
  });
}

export function IncidentFilterBar({
  filterStatus,
  setFilterStatus,
  filterType,
  setFilterType,
  onRefresh,
  loading = false,
  paddingTop = 0,
}: Props) {
  const { colors } = useAppColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.bar, { paddingTop }]}>
      <View style={styles.statusRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {(
            [null, "reported", "in_progress", "resolved"] as (string | null)[]
          ).map((s) => {
            const active = filterStatus === s;
            const color = s ? (STATUS_COLOR[s] ?? "#999") : colors.primary;
            return (
              <TouchableOpacity
                key={s ?? "all-status"}
                style={[
                  styles.chip,
                  active && { backgroundColor: color, borderColor: color },
                ]}
                onPress={() => setFilterStatus(s)}
                activeOpacity={0.75}
              >
                {s ? (
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: active ? "#fff" : color },
                    ]}
                  />
                ) : null}
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {s ? (STATUS_LABEL[s] ?? s) : "Tous statuts"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {onRefresh ? (
          <TouchableOpacity
            style={[styles.refreshBtn, loading && styles.refreshBtnDisabled]}
            onPress={onRefresh}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.refreshIcon}>↻</Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {([null, ...Object.keys(TYPE_LABEL)] as (string | null)[]).map((t) => {
          const active = filterType === t;
          return (
            <TouchableOpacity
              key={t ?? "all-type"}
              style={[styles.chip, active && styles.chipActiveOrange]}
              onPress={() => setFilterType(t)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {t ? (TYPE_LABEL[t] ?? t) : "Tous types"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
