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
    // L'en-tête était un titre posé sur du vide, souligné d'un trait — et ce
    // trait valait `secondary`, un jaune franc en clair, sur toute la largeur de
    // chaque fenêtre de l'application.
    //
    // C'est désormais une bande teintée, qui sépare par sa couleur au lieu d'un
    // filet, et le titre y reprend la barre d'accent des sections de l'accueil et
    // du profil : les fenêtres cessent d'être une famille à part.
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 18,
      paddingVertical: 15,
      backgroundColor: colors.primary + (isDark ? "1A" : "14"),
    },
    accent: {
      width: 3,
      height: 20,
      borderRadius: 2,
      backgroundColor: colors.primary,
    },
    title: { fontSize: 17, fontWeight: "800", color: colors.text, letterSpacing: 0.2, flex: 1 },
    // Sur la surface de la carte, pas sur la bande : le bouton s'en détache au
    // lieu de s'y fondre.
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.white,
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
              <View style={s.accent} />
              <Text style={s.title} numberOfLines={1}>{title}</Text>
              <TouchableOpacity
                style={s.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
              >
                <MaterialIcons name="close" size={17} color={colors.text} />
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
