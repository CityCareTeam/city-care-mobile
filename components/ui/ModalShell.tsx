import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAppColors } from "@/hooks/use-app-colors";
import { useMemo } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function ModalShell({ visible, title, onClose, children }: Props) {
  const { colors, isDark } = useAppColors();

  const s = useMemo(() => StyleSheet.create({
    wrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
    kav: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
    card: {
      width: "100%",
      maxHeight: "85%",
      backgroundColor: colors.white,
      borderRadius: 20,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.5 : 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
    // Un liseré, pas une bande : la barre était soulignée de `secondary`, qui
    // vaut un jaune franc en clair. Il tranchait sur toute la largeur de chaque
    // fenêtre de l'application, pour ne séparer que deux zones de même couleur.
    // Une teinte de bordure neutre suffit à poser la limite.
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.chipBorder,
    },
    title: { fontSize: 17, fontWeight: "800", color: colors.text, letterSpacing: 0.2, flex: 1 },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? "rgba(255,255,255,0.09)" : colors.chipBg,
      alignItems: "center",
      justifyContent: "center",
    },
    body: { padding: 20 },
  }), [colors, isDark]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.wrap}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.kav}>
          <View style={s.card}>
            <View style={s.header}>
              <Text style={s.title}>{title}</Text>
              <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <MaterialIcons name="close" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
