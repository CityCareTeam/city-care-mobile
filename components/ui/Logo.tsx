import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { useMemo } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

type LogoProps = {
  size?: number;
  style?: ViewStyle;
};

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    text: {
      fontWeight: "700",
      color: c.text,
    },
  });
}

export function Logo({ size = 72, style }: LogoProps) {
  const { colors } = useAppColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const radius = size * 0.22;
  const fontSize = size * 0.3;

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: radius },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize }]}>CC+</Text>
    </View>
  );
}
