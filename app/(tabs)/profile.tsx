import { Button } from "@/components/ui/Button";
import { CityCareColors } from "@/constants/theme";
import { logout } from "@/services/auth";
import { clearTokens, getRefreshToken } from "@/storage/tokens";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function ProfileScreen() {
  async function handleLogout() {
    const token = await getRefreshToken();
    if (token) await logout(token);
    await clearTokens();
    router.replace("/login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon profil</Text>
      <Text style={styles.subtitle}>Paramètres — à venir</Text>
      <Button
        label="Se déconnecter"
        variant="secondary"
        onPress={handleLogout}
        style={styles.btn}
      />
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
    fontSize: 24,
    fontWeight: "800",
    color: CityCareColors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: CityCareColors.text,
    opacity: 0.5,
    marginBottom: 40,
  },
  btn: { width: "100%" },
});
