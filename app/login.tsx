import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { Toast } from "@/components/ui/ToastMessage";
import { STRINGS } from "@/constants/strings";
import { CityCareColors } from "@/constants/theme";
import { login } from "@/services/auth";
import { saveTokens } from "@/storage/tokens";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      Toast.show({
        type: "error",
        text1: STRINGS.toast.missingFieldsTitle,
        text2: STRINGS.toast.missingFields,
      });
      return;
    }
    setLoading(true);
    try {
      const tokens = await login({ username: username.trim(), password });
      await saveTokens(tokens.accessToken, tokens.refreshToken);
      router.replace("/(tabs)");
    } catch (e: unknown) {
      Toast.show({
        type: "error",
        text1: STRINGS.toast.loginFailedTitle,
        text2: e instanceof Error ? e.message : STRINGS.api.genericError,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <Card>
        <Logo style={styles.logo} />
        <Text style={styles.title}>CityCare+</Text>

        <Input
          label="Email ou nom d'utilisateur"
          placeholder="jean.dupont ou jean@mail.com"
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
        />

        <Input
          label="Mot de passe"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Button
          label="Se connecter"
          onPress={handleLogin}
          loading={loading}
          style={styles.btnTop}
        />
        <Button
          label="Créer un compte"
          variant="secondary"
          onPress={() => router.push("/register")}
          disabled={loading}
        />
      </Card>
      <Text style={styles.version}>
        v {Constants.expoConfig?.version ?? "1.0.0"}
      </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CityCareColors.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: CityCareColors.text,
    marginBottom: 28,
  },
  btnTop: {
    marginTop: 8,
    marginBottom: 12,
  },
  version: {
    marginTop: 20,
    fontSize: 12,
    color: CityCareColors.text,
    opacity: 0.35,
  },
});
