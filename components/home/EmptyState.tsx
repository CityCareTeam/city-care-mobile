import { useHomeStyles } from "@/components/home/home-styles";
import { Text } from "@/components/ui/AppText";
import { useAppColors } from "@/hooks/use-app-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { View } from "react-native";

export function EmptyState({ text }: { text: string }) {
  const { colors } = useAppColors();
  const styles = useHomeStyles();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIconWrap, { backgroundColor: colors.secondary }]}>
        <MaterialIcons name="inbox" size={26} color={colors.text + "35"} />
      </View>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}
