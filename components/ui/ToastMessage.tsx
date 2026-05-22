import { CityCareColors } from "@/constants/theme";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";

type ToastType = "success" | "error";
type ToastData = { type: ToastType; text1: string; text2?: string } | null;

let _setToast: ((data: ToastData) => void) | null = null;

export const Toast = {
  show(data: Exclude<ToastData, null>) {
    _setToast?.(data);
  },
};

export function ToastMessage() {
  const [toast, setToast] = useState<ToastData>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    _setToast = (data) => {
      animRef.current?.stop();
      setToast(data);
      opacity.setValue(0);
      translateY.setValue(-20);
      animRef.current = Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(3200),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]);
      animRef.current.start(({ finished }) => {
        if (finished) setToast(null);
      });
    };
    return () => {
      _setToast = null;
    };
  }, [opacity, translateY]);

  if (!toast) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        toast.type === "error" ? styles.error : styles.success,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <Text style={styles.text1}>{toast.text1}</Text>
      {toast.text2 ? <Text style={styles.text2}>{toast.text2}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 56,
    left: 16,
    right: 16,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  error: { backgroundColor: CityCareColors.statusRed },
  success: { backgroundColor: CityCareColors.statusGreen },
  text1: { color: "#fff", fontWeight: "700", fontSize: 14 },
  text2: { color: "rgba(255,255,255,0.9)", fontSize: 13, marginTop: 3 },
});
