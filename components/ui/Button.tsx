import { CityCareColors } from "@/constants/theme";
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

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
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
        <ActivityIndicator
          color={isPrimary ? CityCareColors.white : CityCareColors.text}
        />
      ) : (
        <Text style={isPrimary ? styles.labelPrimary : styles.labelSecondary}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
    height: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: CityCareColors.primary,
  },
  secondary: {
    borderWidth: 1.5,
    borderColor: CityCareColors.primary,
    backgroundColor: "transparent",
  },
  pressed: {
    opacity: 0.75,
  },
  labelPrimary: {
    color: CityCareColors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  labelSecondary: {
    color: CityCareColors.text,
    fontSize: 15,
    fontWeight: "500",
  },
});
