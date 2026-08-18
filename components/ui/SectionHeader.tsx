import type { AppColors } from "@/hooks/use-app-colors";
import { DANGER } from "@/constants/theme";
import { View } from "react-native";
import { Text } from "@/components/ui/AppText";

type Props = {
  title: string;
  colors: AppColors;
  required?: boolean;
};

export function SectionHeader({ title, colors, required }: Props) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, marginTop: 6 }}>
      <View style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: colors.primary }} />
      <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text, opacity: 0.6, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {title}
      </Text>
      {required && (
        <Text style={{ fontSize: 13, color: DANGER, fontWeight: "700", marginLeft: -4 }}>*</Text>
      )}
    </View>
  );
}
