import { Image } from "expo-image";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  uri: string | null;
  onClose: () => void;
};

export function PhotoViewer({ uri, onClose }: Props) {
  if (!uri) return null;

  return (
    <View style={s.overlay}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      <Image source={{ uri }} style={s.image} contentFit="contain" />
      <TouchableOpacity style={s.closeBtn} onPress={onClose}>
        <Text style={s.closeBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000d",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  image: { width: "100%", height: "80%" },
  closeBtn: {
    position: "absolute",
    top: 52,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0008",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
