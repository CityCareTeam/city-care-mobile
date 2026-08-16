import { useAppColors } from "@/hooks/use-app-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const DANGER = "#e53e3e";

type Props = {
  title?: string;
  detail: string;
  onRetry?: () => void;
  /** Le geste n'est pas toujours « réessayer » : parfois il n'y a qu'à acquitter. */
  actionLabel?: string;
};

/**
 * Carte d'échec des écrans en liste. Le pendant de `MapNotice`, qui remplit le
 * même rôle sur la carte mais en surface de verre flottante — ici on est dans
 * le flux, donc c'est une carte pleine.
 *
 * Elle existe parce qu'un chargement raté et une liste réellement vide se
 * ressemblent trait pour trait, et que sans bouton l'utilisateur n'a d'autre
 * recours que de quitter l'écran.
 */
export function ErrorNotice({
  title = "Chargement impossible",
  detail,
  onRetry,
  actionLabel = "Réessayer",
}: Props) {
  const { colors } = useAppColors();
  const styles = useMemo(() => makeStyles(colors.text), [colors.text]);

  return (
    <View style={styles.card}>
      <MaterialIcons name="cloud-off" size={22} color={DANGER} />
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      {onRetry && (
        <TouchableOpacity
          style={styles.retry}
          onPress={onRetry}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.retryLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function makeStyles(textColor: string) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: 16,
      backgroundColor: DANGER + "14",
      marginBottom: 16,
    },
    text: { flex: 1, gap: 2 },
    title: { fontSize: 14, fontWeight: "700", color: textColor },
    detail: { fontSize: 12, color: textColor, opacity: 0.55 },
    retry: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 14,
      backgroundColor: DANGER,
    },
    retryLabel: { fontSize: 12, fontWeight: "700", color: "#fff" },
  });
}
