import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { useMemo } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
} from "react-native";

type InputProps = TextInputProps & {
  label: string;
  error?: string;
};

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    wrapper: {
      width: "100%",
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      color: c.text,
      marginBottom: 6,
      fontWeight: "500",
    },
    input: {
      width: "100%",
      height: 48,
      borderWidth: 1,
      borderColor: c.inputBorder,
      borderRadius: 10,
      paddingHorizontal: 14,
      fontSize: 15,
      color: c.text,
      backgroundColor: c.inputBg,
    },
    inputError: {
      borderColor: c.statusRed,
    },
    errorText: {
      color: c.statusRed,
      fontSize: 12,
      marginTop: 4,
    },
  });
}

export function Input({ label, error, style, ...props }: InputProps) {
  const { colors, isDark } = useAppColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.wrapper} collapsable={false}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !!error && styles.inputError, style]}
        placeholderTextColor={isDark ? "#888" : "#aaa"}
        {...props}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}
