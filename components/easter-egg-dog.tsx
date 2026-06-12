import { useEffect, useRef } from "react";
import { Animated, Modal, ScrollView, StyleSheet, Text, View } from "react-native";

const DOG = `⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⣤⣶⣶⣶⣶⣶⣤⣄⡀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣠⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣄⡀⠀⠀⠀⠀⠀
⠀⠀⠀⣠⣴⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣮⣵⣄⠀⠀⠀
⠀⠀⢾⣻⣿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢿⣿⣿⡀⠀
⠀⠸⣽⣻⠃⣿⡿⠋⣉⠛⣿⣿⣿⣿⣿⣿⣿⣿⣏⡟⠉⡉⢻⣿⡌⣿⣳⡥⠀
⠀⢜⣳⡟⢸⣿⣷⣄⣠⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⣤⣠⣼⣿⣇⢸⢧⢣⠀
⠀⠨⢳⠇⣸⣿⣿⢿⣿⣿⣿⣿⡿⠿⠿⠿⢿⣿⣿⣿⣿⣿⣿⣿⣿⠀⡟⢆⠀
⠀⠀⠈⠀⣾⣿⣿⣼⣿⣿⣿⣿⡀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣽⣿⣿⠐⠈⠀⠀
⠀⢀⣀⣼⣷⣭⣛⣯⡝⠿⢿⣛⣋⣤⣤⣀⣉⣛⣻⡿⢟⣵⣟⣯⣶⣿⣄⡀⠀
⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣶⣶⣶⣾⣶⣶⣴⣾⣿⣿⣿⣿⣿⣿⢿⣿⣿⣧
⣿⣿⣿⠿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠿⣿⡿`;

type Props = { visible: boolean; onHide: () => void };

export function EasterEggDog({ visible, onHide }: Props) {
  const colorAnim  = useRef(new Animated.Value(0)).current;
  const wagAnim    = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;

    textOpacity.setValue(1);
    colorAnim.setValue(0);
    wagAnim.setValue(0);

    // Cycle orange → jaune → orange en continu
    const colorLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(colorAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
        Animated.timing(colorAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
      ]),
    );
    colorLoop.start();

    // Wag gauche-droite en boucle
    const wagLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(200),
        Animated.timing(wagAnim, { toValue:  1, duration: 110, useNativeDriver: true }),
        Animated.timing(wagAnim, { toValue: -1, duration: 110, useNativeDriver: true }),
        Animated.timing(wagAnim, { toValue:  0, duration: 110, useNativeDriver: true }),
        Animated.delay(500),
      ]),
    );
    wagLoop.start();

    // Fermeture automatique
    const timer = setTimeout(() => {
      colorLoop.stop();
      wagLoop.stop();
      Animated.timing(textOpacity, { toValue: 0, duration: 300, useNativeDriver: true })
        .start(() => onHide());
    }, 2200);

    return () => {
      clearTimeout(timer);
      colorLoop.stop();
      wagLoop.stop();
    };
  }, [visible, colorAnim, wagAnim, textOpacity, onHide]);

  const dogColor = colorAnim.interpolate({
    inputRange:  [0, 0.5, 1],
    outputRange: ["#f6aa54", "#f4e044", "#f6aa54"],
  });

  const wagRotate = wagAnim.interpolate({
    inputRange:  [-1, 0, 1],
    outputRange: ["-5deg", "0deg", "5deg"],
  });

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay} pointerEvents="none">
        <Animated.View style={[styles.dogBg, { transform: [{ rotate: wagRotate }], opacity: textOpacity }]}>
          <Animated.Text style={[styles.ascii, { color: dogColor }]} selectable={false}>
            {DOG}
          </Animated.Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dogBg: {
    backgroundColor: "#000000cc",
    borderRadius: 16,
    padding: 14,
  },
  ascii: {
    fontSize: 18,
    lineHeight: 22,
    textAlign: "center",
  },
});
