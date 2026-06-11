import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { useMemo, useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    type TextInputProps,
    TouchableOpacity,
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
    inputRow: {
      position: "relative",
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
    inputPassword: {
      paddingRight: 46,
    },
    inputError: {
      borderColor: c.statusRed,
    },
    eyeBtn: {
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 0,
      width: 46,
      alignItems: "center",
      justifyContent: "center",
    },
    errorText: {
      color: c.statusRed,
      fontSize: 12,
      marginTop: 4,
    },
  });
}

export function Input({ label, error, style, secureTextEntry, ...props }: InputProps) {
  const { colors, isDark } = useAppColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [hidden, setHidden] = useState(true);
  const isPassword = Boolean(secureTextEntry);

  return (
    <View style={styles.wrapper} collapsable={false}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            isPassword && styles.inputPassword,
            !!error && styles.inputError,
            style,
          ]}
          placeholderTextColor={isDark ? "#888" : "#aaa"}
          secureTextEntry={isPassword && hidden}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
          >
            <MaterialIcons
              name={hidden ? "visibility-off" : "visibility"}
              size={20}
              color={isDark ? "#888" : "#bbb"}
            />
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}
