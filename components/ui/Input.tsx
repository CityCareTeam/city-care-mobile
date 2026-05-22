import { CityCareColors } from "@/constants/theme";
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

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !!error && styles.inputError, style]}
        placeholderTextColor="#aaa"
        {...props}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: CityCareColors.text,
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: CityCareColors.text,
    backgroundColor: "#fafafa",
  },
  inputError: {
    borderColor: CityCareColors.statusRed,
  },
  errorText: {
    color: CityCareColors.statusRed,
    fontSize: 12,
    marginTop: 4,
  },
});
