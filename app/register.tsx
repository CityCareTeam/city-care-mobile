import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { Toast } from "@/components/ui/ToastMessage";
import { STRINGS } from "@/constants/strings";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { register } from "@/services/auth";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    scrollContent: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    logo: { marginBottom: 16 },
    title: { fontSize: 24, fontWeight: "800", color: c.text, marginBottom: 28 },
    btnTop: { marginTop: 8, marginBottom: 12 },
  });
}

export default function RegisterScreen() {
  const { colors } = useAppColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (
      !email.trim() ||
      !username.trim() ||
      !firstName.trim() ||
      !lastName.trim() ||
      !password.trim() ||
      !confirm.trim()
    ) {
      Toast.show({
        type: "error",
        text1: STRINGS.toast.missingFieldsTitle,
        text2: STRINGS.toast.missingFields,
      });
      return;
    }
    const nameRegex = /^[\p{L} \-'.]+$/u;
    const usernameRegex = /^[\p{L}\p{N}._\-]+$/u;
    if (firstName.trim().length > 30 || lastName.trim().length > 30) {
      Toast.show({ type: "error", text1: "Champs invalides", text2: STRINGS.toast.nameTooLong });
      return;
    }
    if (!nameRegex.test(firstName.trim()) || !nameRegex.test(lastName.trim())) {
      Toast.show({ type: "error", text1: "Champs invalides", text2: STRINGS.toast.nameInvalidChars });
      return;
    }
    if (username.trim().length > 30) {
      Toast.show({ type: "error", text1: "Champs invalides", text2: STRINGS.toast.usernameTooLong });
      return;
    }
    if (!usernameRegex.test(username.trim())) {
      Toast.show({ type: "error", text1: "Champs invalides", text2: STRINGS.toast.usernameInvalidChars });
      return;
    }
    if (password !== confirm) {
      Toast.show({
        type: "error",
        text1: STRINGS.toast.passwordMismatchTitle,
        text2: STRINGS.toast.passwordMismatch,
      });
      return;
    }
    setLoading(true);
    try {
      await register({
        email: email.trim(),
        username: username.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
      });
      Toast.show({
        type: "success",
        text1: STRINGS.toast.registerSuccessTitle,
        text2: STRINGS.toast.registerSuccess,
      });
      router.replace("/login");
    } catch (e: unknown) {
      Toast.show({
        type: "error",
        text1: STRINGS.toast.registerFailedTitle,
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
        <Text style={styles.title}>Créer un compte</Text>

        <Input
          label="Prénom"
          placeholder="Jean"
          autoCapitalize="words"
          autoCorrect={false}
          value={firstName}
          onChangeText={setFirstName}
        />
        <Input
          label="Nom"
          placeholder="Dupont"
          autoCapitalize="words"
          autoCorrect={false}
          value={lastName}
          onChangeText={setLastName}
        />
        <Input
          label="Email"
          placeholder="exemple@mail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label="Nom d'utilisateur"
          placeholder="jean.dupont"
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
        <Input
          label="Confirmer le mot de passe"
          placeholder="••••••••"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />

        <Button
          label="S'inscrire"
          onPress={handleRegister}
          loading={loading}
          style={styles.btnTop}
        />
        <Button
          label="Déjà un compte ? Se connecter"
          variant="secondary"
          onPress={() => router.back()}
          disabled={loading}
        />
      </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

