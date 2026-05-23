import { STATUS_COLOR, STATUS_LABEL, TYPE_LABEL } from "@/constants/incidents";
import { CityCareColors } from "@/constants/theme";
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
  /** Affiche le bouton ↻ si fourni. Omis sur le dashboard (pull-to-refresh). */
  onRefresh?: () => void;
  loading?: boolean;
  /** Décalage vertical (safe area + marge). Défaut : 0. */
  paddingTop?: number;
};

export function IncidentFilterBar({
  filterStatus,
  setFilterStatus,
  filterType,
  setFilterType,
  onRefresh,
  loading = false,
  paddingTop = 0,
}: Props) {
  return (
    <View style={[styles.bar, { paddingTop }]}>
      {/* Statuts + bouton refresh */}
      <View style={styles.statusRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {([null, "reported", "in_progress", "resolved"] as (string | null)[]).map((s) => {
            const active = filterStatus === s;
            const color = s ? (STATUS_COLOR[s] ?? "#999") : CityCareColors.text;
            return (
              <TouchableOpacity
                key={s ?? "all-status"}
                style={[styles.chip, active && { backgroundColor: color, borderColor: color }]}
                onPress={() => setFilterStatus(s)}
                activeOpacity={0.75}
              >
                {s ? (
                  <View style={[styles.dot, { backgroundColor: active ? "#fff" : color }]} />
                ) : null}
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
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

      {/* Types */}
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

const styles = StyleSheet.create({
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
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.12)",
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
    color: CityCareColors.text,
  },
  chipActiveOrange: {
    backgroundColor: CityCareColors.primary,
    borderColor: CityCareColors.primary,
  },
  chipTextActive: {
    color: "#fff",
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CityCareColors.primary,
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
