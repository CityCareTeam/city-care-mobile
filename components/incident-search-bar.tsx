import { GlassPillSelector } from "@/components/ui/GlassPillSelector";
import { useAppColors } from "@/hooks/use-app-colors";
import { usePreferences } from "@/context/PreferencesContext";
import { useStrings } from "@/hooks/use-strings";
import type { SortMode } from "@/utils/incident-search";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/AppText";

type Props = {
  query: string;
  onQueryChange: (query: string) => void;
  sort: SortMode;
  onSortChange: (sort: SortMode) => void;
};

/**
 * Recherche et tri du fil.
 *
 * Les filtres par statut et par type existaient déjà, mais ils ne répondent
 * qu'aux questions qu'on a prévues. Retrouver « le lampadaire de la rue
 * Victor-Hugo » demandait de faire défiler — c'est ce que ce champ remplace.
 *
 * Le tri est en pastilles et non dans un menu : trois choix se montrent, ils ne
 * se cachent pas derrière un appui de plus.
 */
export function IncidentSearchBar({ query, onQueryChange, sort, onSortChange }: Props) {
  const { colors } = useAppColors();
  const t = useStrings();
  const { location: canLocate } = usePreferences();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.field}>
        <MaterialIcons name="search" size={18} color={colors.text + "66"} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={onQueryChange}
          placeholder={t.home.searchPlaceholder}
          placeholderTextColor={colors.text + "66"}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          // Le champ n'est pas un formulaire : on efface, on ne valide pas.
          clearButtonMode="never"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => onQueryChange("")}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t.home.searchClear}
          >
            <MaterialIcons name="close" size={17} color={colors.text + "88"} />
          </TouchableOpacity>
        )}
      </View>

      {/* « Proches » disparaît quand la localisation est coupée dans les
          réglages : un bouton qui ne peut rien faire vaut moins qu'un bouton
          absent — on le presserait en boucle en cherchant ce qui ne marche
          pas. */}
      <GlassPillSelector
        options={[
          { label: t.home.sortRecent, value: "recent" as const },
          { label: t.home.sortOldest, value: "oldest" as const },
          ...(canLocate ? [{ label: t.home.sortNearest, value: "nearest" as const }] : []),
        ]}
        activeValue={sort}
        onSelect={onSortChange}
      />
    </View>
  );
}

/** Message d'échec propre à la recherche : il cite ce qui a été cherché. */
export function NoSearchResults({ query }: { query: string }) {
  const { colors } = useAppColors();
  const t = useStrings();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.empty}>
      <MaterialIcons name="search-off" size={26} color={colors.text + "35"} />
      <Text style={styles.emptyText}>{t.home.noSearchResults(query.trim())}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useAppColors>["colors"]) {
  return StyleSheet.create({
    wrap: { gap: 12, marginBottom: 16 },
    field: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      height: 44,
      paddingHorizontal: 13,
      borderRadius: 14,
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.inputBorder,
    },
    input: { flex: 1, fontSize: 14, color: colors.text, padding: 0 },
    empty: { alignItems: "center", gap: 10, paddingVertical: 34 },
    emptyText: { fontSize: 13, color: colors.text, opacity: 0.5, textAlign: "center" },
  });
}
