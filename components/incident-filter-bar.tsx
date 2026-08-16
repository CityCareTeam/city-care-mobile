import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { STATUS_COLOR, STATUS_LABEL, TYPE_LABEL } from "@/constants/incidents";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
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
  /** Absent pour un visiteur non connecté : il n'a pas de signalements à isoler. */
  mineOnly?: boolean;
  onToggleMine?: () => void;
  followedOnly?: boolean;
  onToggleFollowed?: () => void;
};

/** Construites au rendu : « Tous » suit la langue, une constante l'aurait figé. */
function statusOptions(all: string): PillOption<string | null>[] {
  return [
    { label: all, value: null },
    { label: STATUS_LABEL.reported,    value: "reported",    dotColor: STATUS_COLOR.reported },
    { label: STATUS_LABEL.in_progress, value: "in_progress", dotColor: STATUS_COLOR.in_progress },
    { label: STATUS_LABEL.resolved,    value: "resolved",    dotColor: STATUS_COLOR.resolved },
  ];
}

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
    // La pastille de l'auteur porte une icône : deux éléments côte à côte, là
    // où les catégories n'ont qu'un mot.
    mineChip: { flexDirection: "row", alignItems: "center", gap: 5 },
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
  mineOnly,
  onToggleMine,
  followedOnly,
  onToggleFollowed,
}: Props) {
  const { colors, isDark } = useAppColors();
  // Nommé `strings` et non `t` : la boucle des types utilise déjà `t`.
  const strings = useStrings();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  return (
    <View style={[styles.bar, { paddingTop: paddingTop + 6 }]}>
      {/* Statuts — pill selector animé */}
      <View style={styles.statusRow}>
        <GlassPillSelector
          options={statusOptions(strings.incident.allFilter)}
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
          {/* « Les miens » ouvre la rangée : c'est un filtre sur l'auteur, pas
              sur le type, et le mettre en tête évite qu'on le cherche au milieu
              des catégories. Un chevron le sépare visuellement du reste. */}
          {onToggleMine && (
            <TouchableOpacity
              style={[styles.typeChip, styles.mineChip, mineOnly && styles.typeChipActive]}
              onPress={onToggleMine}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ selected: mineOnly }}
              accessibilityLabel={strings.incident.mineOnlyA11y}
            >
              <MaterialIcons
                name="person-pin-circle"
                size={13}
                color={mineOnly ? "#fff" : colors.text}
                style={!mineOnly && { opacity: 0.55 }}
              />
              <Text style={[styles.typeChipText, mineOnly && styles.typeChipTextActive]}>
                {strings.incident.mineOnly}
              </Text>
            </TouchableOpacity>
          )}

          {onToggleFollowed && (
            <TouchableOpacity
              style={[styles.typeChip, styles.mineChip, followedOnly && styles.typeChipActive]}
              onPress={onToggleFollowed}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ selected: followedOnly }}
              accessibilityLabel={strings.incident.followedFilterA11y}
            >
              <MaterialIcons
                name="bookmark"
                size={13}
                color={followedOnly ? "#fff" : colors.text}
                style={!followedOnly && { opacity: 0.55 }}
              />
              <Text style={[styles.typeChipText, followedOnly && styles.typeChipTextActive]}>
                {strings.incident.followedFilter}
              </Text>
            </TouchableOpacity>
          )}

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
                  {t ? (TYPE_LABEL[t] ?? t) : strings.incident.allFilter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </GlassSurface>
    </View>
  );
}
