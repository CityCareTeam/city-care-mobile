import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { Toast } from "@/components/ui/ToastMessage";
import { CityCareColors } from "@/constants/theme";
import { register } from "@/services/auth";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text } from "react-native";

export default function RegisterScreen() {
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
        text1: "Champs manquants",
        text2: "Veuillez remplir tous les champs.",
      });
      return;
    }
    if (password !== confirm) {
      Toast.show({
        type: "error",
        text1: "Mots de passe différents",
        text2: "Les mots de passe ne correspondent pas.",
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
        text1: "Compte créé !",
        text2: "Vous pouvez maintenant vous connecter.",
      });
      router.replace("/login");
    } catch (e: unknown) {
      Toast.show({
        type: "error",
        text1: "Inscription échouée",
        text2: e instanceof Error ? e.message : "Une erreur est survenue.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CityCareColors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: CityCareColors.text,
    marginBottom: 28,
  },
  btnTop: {
    marginTop: 8,
    marginBottom: 12,
  },
});
