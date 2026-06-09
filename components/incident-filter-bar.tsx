import { STATUS_COLOR, STATUS_LABEL, TYPE_LABEL } from "@/constants/incidents";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { GlassPillSelector, PillOption } from "@/components/ui/GlassPillSelector";
import { BlurView } from "expo-blur";
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

const STATUS_OPTIONS: PillOption<string | null>[] = [
  { label: "Tous", value: null },
  { label: STATUS_LABEL.reported,    value: "reported",    dotColor: STATUS_COLOR.reported },
  { label: STATUS_LABEL.in_progress, value: "in_progress", dotColor: STATUS_COLOR.in_progress },
  { label: STATUS_LABEL.resolved,    value: "resolved",    dotColor: STATUS_COLOR.resolved },
];

const TYPE_OPTIONS: (string | null)[] = [null, ...Object.keys(TYPE_LABEL)];

function makeStyles(c: AppColors, isDark: boolean) {
  return StyleSheet.create({
    bar: {
      gap: 8,
      paddingBottom: 10,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      gap: 8,
    },
    selectorWrapper: {
      flex: 1,
    },
    refreshBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.primary,
      justifyContent: "center",
      alignItems: "center",
      flexShrink: 0,
    },
    refreshBtnDisabled: { opacity: 0.55 },
    refreshIcon: { fontSize: 18, color: "#fff", fontWeight: "700" },
    typeContainer: {
      marginHorizontal: 12,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(255,255,255,0.12)"
        : "rgba(255,255,255,0.7)",
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 12,
      elevation: 6,
    },
    typeOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark
        ? "rgba(25, 25, 30, 0.40)"
        : "rgba(255, 255, 255, 0.30)",
    },
    typeScroll: {
      flexDirection: "row",
    },
    typeScrollContent: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 6,
      paddingVertical: 5,
      gap: 4,
    },
    typeChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 18,
    },
    typeChipActive: {
      backgroundColor: c.primary,
    },
    typeChipText: {
      fontSize: 12,
      fontWeight: "600",
      color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.40)",
    },
    typeChipTextActive: {
      color: "#fff",
    },
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
  const { colors, isDark } = useAppColors();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  return (
    <View style={[styles.bar, { paddingTop: paddingTop + 6 }]}>
      {/* Statuts — pill selector animé */}
      <View style={styles.statusRow}>
        <View style={styles.selectorWrapper}>
          <GlassPillSelector
            options={STATUS_OPTIONS}
            activeValue={filterStatus}
            onSelect={setFilterStatus}
          />
        </View>
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

      {/* Types — container verre unique avec chips */}
      <View style={styles.typeContainer}>
        <BlurView
          style={StyleSheet.absoluteFillObject}
          intensity={isDark ? 55 : 75}
          tint={isDark ? "dark" : "light"}
        />
        <View style={styles.typeOverlay} pointerEvents="none" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeScrollContent}
          style={styles.typeScroll}
        >
          {TYPE_OPTIONS.map((t) => {
            const active = filterType === t;
            return (
              <TouchableOpacity
                key={t ?? "all-type"}
                style={[styles.typeChip, active && styles.typeChipActive]}
                onPress={() => setFilterType(t)}
                activeOpacity={0.75}
              >
                <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                  {t ? (TYPE_LABEL[t] ?? t) : "Tous"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}
