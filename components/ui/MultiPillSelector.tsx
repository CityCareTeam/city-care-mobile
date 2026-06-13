import { useAppColors } from "@/hooks/use-app-colors";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type MultiPillOption = {
  label: string;
  value: string;
};

type Props = {
  options: MultiPillOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  style?: object;
};

export function MultiPillSelector({ options, selectedValues, onToggle, style }: Props) {
  const { colors } = useAppColors();

  return (
    <View style={[styles.container, style]}>
      {options.map((opt) => {
        const selected = selectedValues.includes(opt.value);
        return (
          <Pressable
            key={opt.value}
            onPress={() => onToggle(opt.value)}
            style={[
              styles.pill,
              {
                backgroundColor: selected ? colors.primary : "transparent",
                borderColor: selected ? colors.primary : colors.primary + "55",
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: selected ? "#fff" : colors.text + "80" },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
});
