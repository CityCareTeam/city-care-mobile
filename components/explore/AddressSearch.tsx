import { ModalShell } from "@/components/ui/ModalShell";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import { searchPlaces, type PlaceSuggestion } from "@/services/geocoding";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/AppText";

/** Nominatim demande de ne pas dépasser une requête par seconde. */
const DEBOUNCE_MS = 400;
const MIN_QUERY = 3;

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Centre courant, pour privilégier les environs. */
  near: { latitude: number; longitude: number } | null;
  onPick: (place: PlaceSuggestion) => void;
};

/**
 * Aller à une adresse sur la carte.
 *
 * La carte s'ouvrait sur la position de l'utilisateur, et il n'y avait aucun
 * moyen d'aller voir ailleurs qu'en faisant glisser le doigt sur des kilomètres.
 * Regarder un quartier où l'on n'est pas — celui où l'on travaille, celui d'un
 * proche — était impraticable.
 *
 * Le formulaire de signalement avait déjà ce champ ; c'est le même service qui
 * répond, et il vit désormais dans `services/geocoding.ts` pour que les deux ne
 * divergent pas.
 */
export function AddressSearch({ visible, onClose, near, onPick }: Props) {
  const { colors } = useAppColors();
  const t = useStrings();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Repartir propre à chaque ouverture : retrouver la recherche de la semaine
  // dernière n'aide personne.
  useEffect(() => {
    if (!visible) {
      setQuery("");
      setResults([]);
      setFailed(false);
    }
  }, [visible]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < MIN_QUERY) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    timer.current = setTimeout(() => {
      searchPlaces(query.trim(), near)
        .then((places) => {
          setResults(places);
          setFailed(false);
        })
        .catch(() => setFailed(true))
        .finally(() => setSearching(false));
    }, DEBOUNCE_MS);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // `near` volontairement hors des dépendances : la carte bouge sous les
    // doigts, et le relancer à chaque image rejouerait la requête sans fin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const empty = query.trim().length >= MIN_QUERY && !searching && !failed && results.length === 0;

  return (
    <ModalShell visible={visible} title={t.map.searchTitle} onClose={onClose}>
      <View style={styles.field}>
        <MaterialIcons name="search" size={19} color={colors.text + "70"} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={t.map.searchPlaceholder}
          placeholderTextColor={colors.text + "55"}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={() => results[0] && onPick(results[0])}
        />
        {searching && <ActivityIndicator size="small" color={colors.primary} />}
        {!searching && query.length > 0 && (
          <TouchableOpacity
            onPress={() => setQuery("")}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t.home.searchClear}
          >
            <MaterialIcons name="close" size={17} color={colors.text + "70"} />
          </TouchableOpacity>
        )}
      </View>

      {results.map((place, index) => (
        <TouchableOpacity
          key={`${place.latitude},${place.longitude},${index}`}
          style={styles.result}
          onPress={() => onPick(place)}
          activeOpacity={0.75}
          accessibilityRole="button"
        >
          <MaterialIcons name="location-on" size={17} color={colors.primary} />
          <Text style={styles.resultLabel} numberOfLines={2}>
            {place.label}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Trois situations qui donnent la même liste vide, et qui ne se règlent
          pas de la même façon : trop court, rien trouvé, service muet. */}
      {query.trim().length < MIN_QUERY && !searching && (
        <Text style={styles.hint}>{t.map.searchHint}</Text>
      )}
      {empty && <Text style={styles.hint}>{t.map.searchNoResult(query.trim())}</Text>}
      {failed && <Text style={styles.hint}>{t.map.searchFailed}</Text>}
    </ModalShell>
  );
}

function makeStyles(c: ReturnType<typeof useAppColors>["colors"]) {
  return StyleSheet.create({
    field: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      paddingHorizontal: 13,
      height: 46,
      borderRadius: 14,
      backgroundColor: c.chipBg,
      borderWidth: 1,
      borderColor: c.chipBorder,
      marginBottom: 12,
    },
    input: { flex: 1, fontSize: 14.5, color: c.text, padding: 0 },
    result: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: c.chipBorder,
    },
    resultLabel: { flex: 1, fontSize: 13.5, color: c.text, lineHeight: 18 },
    hint: {
      fontSize: 12.5,
      color: c.text,
      opacity: 0.5,
      textAlign: "center",
      paddingVertical: 18,
      lineHeight: 18,
    },
  });
}
