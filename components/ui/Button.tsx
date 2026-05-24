import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { useMemo } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    ViewStyle,
} from "react-native";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    base: {
      width: "100%",
      height: 50,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    primary: {
      backgroundColor: c.primary,
    },
    secondary: {
      borderWidth: 1.5,
      borderColor: c.primary,
      backgroundColor: "transparent",
    },
    pressed: {
      opacity: 0.75,
    },
    labelPrimary: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },
    labelSecondary: {
      color: c.text,
      fontSize: 15,
      fontWeight: "500",
    },
  });
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const { colors } = useAppColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isPrimary = variant === "primary";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        (pressed || disabled) && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? "#fff" : colors.text} />
      ) : (
        <Text style={isPrimary ? styles.labelPrimary : styles.labelSecondary}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
