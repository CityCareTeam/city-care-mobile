import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { useMemo } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      width: "100%",
      maxWidth: 380,
      backgroundColor: c.white,
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
}

export function Card({ children, style }: CardProps) {
  const { colors } = useAppColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return <View style={[styles.card, style]}>{children}</View>;
}
