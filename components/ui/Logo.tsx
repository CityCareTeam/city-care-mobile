import { CityCareColors } from "@/constants/theme";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

type LogoProps = {
  size?: number;
  style?: ViewStyle;
};

export function Logo({ size = 72, style }: LogoProps) {
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: CityCareColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "700",
    color: CityCareColors.text,
  },
});
