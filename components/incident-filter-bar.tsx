import { STATUS_COLOR, STATUS_LABEL, TYPE_LABEL } from "@/constants/incidents";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { GlassPillSelector, PillOption } from "@/components/ui/GlassPillSelector";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { useMemo } from "react";
import {
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
    // Le rafraîchissement est automatique — focus, sondage et reprise après
    // coupure. Le sélecteur occupe donc toute la largeur.
    statusRow: {
      paddingHorizontal: 12,
    },
    // Flou, voile et liseré viennent de GlassSurface — commun à tout ce qui
    // flotte sur la carte.
    typeContainer: {
      marginHorizontal: 12,
      borderRadius: 24,
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
  paddingTop = 0,
}: Props) {
  const { colors, isDark } = useAppColors();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  return (
    <View style={[styles.bar, { paddingTop: paddingTop + 6 }]}>
      {/* Statuts — pill selector animé */}
      <View style={styles.statusRow}>
        <GlassPillSelector
          options={STATUS_OPTIONS}
          activeValue={filterStatus}
          onSelect={setFilterStatus}
        />
      </View>

      {/* Types — container verre unique avec chips */}
      <GlassSurface style={styles.typeContainer}>
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
      </GlassSurface>
    </View>
  );
}
