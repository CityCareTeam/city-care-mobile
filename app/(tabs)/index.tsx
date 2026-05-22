import { CityCareColors } from "@/constants/theme";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CityCare+</Text>
      <Text style={styles.subtitle}>Tableau de bord — à venir</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CityCareColors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: CityCareColors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: CityCareColors.text,
    opacity: 0.5,
  },
});
