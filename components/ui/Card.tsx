import { CityCareColors } from "@/constants/theme";
import { StyleSheet, View, ViewStyle } from "react-native";

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: CityCareColors.white,
    borderRadius: 16,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    alignItems: "center",
  },
});
