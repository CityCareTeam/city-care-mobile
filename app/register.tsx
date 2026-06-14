import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { Toast } from "@/components/ui/ToastMessage";
import { STRINGS } from "@/constants/strings";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { getStrength, type StrengthLevel } from "@/utils/password-strength";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { register } from "@/services/auth";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Styles ────────────────────────────────────────────────────────────────────

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.primary },
    hero: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 28, gap: 4 },
    appName: { fontSize: 22, fontWeight: "900", color: "#fff", letterSpacing: 0.5 },
    formCard: {
      flexGrow: 1,
      backgroundColor: c.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 28,
      paddingTop: 32,
    },
    formTitle: { fontSize: 22, fontWeight: "800", color: c.text, marginBottom: 4 },
    formSub: { fontSize: 14, color: c.text, opacity: 0.5, marginBottom: 20 },
    row: { flexDirection: "row", gap: 12 },
    rowField: { flex: 1 },
    strengthRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: -10,
      marginBottom: 16,
    },
    strengthBars: { flexDirection: "row", gap: 4, flex: 1 },
    strengthBar: { flex: 1, height: 3, borderRadius: 2 },
    strengthLabel: { fontSize: 11, fontWeight: "700", minWidth: 36, textAlign: "right" },
    confirmError: { fontSize: 12, color: "#e53e3e", marginTop: -10, marginBottom: 12 },
    btnTop: { marginTop: 8, marginBottom: 12 },
    divider: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
    dividerLine: { flex: 1, height: 1, backgroundColor: c.inputBorder },
    dividerText: { fontSize: 12, color: c.text, opacity: 0.35, fontWeight: "500" },
  });
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const { colors } = useAppColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const [email, setEmail]         = useState("");
  const [username, setUsername]   = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [loading, setLoading]     = useState(false);

  const strength       = getStrength(password);
  const confirmMismatch = confirm.length > 0 && confirm !== password;

  async function handleRegister() {
    if (!email.trim() || !username.trim() || !firstName.trim() || !lastName.trim() || !password.trim() || !confirm.trim()) {
      Toast.show({ type: "error", text1: STRINGS.toast.missingFieldsTitle, text2: STRINGS.toast.missingFields });
      return;
    }
    const nameRegex     = /^[\p{L} \-'.]+$/u;
    const usernameRegex = /^[\p{L}\p{N}._\-]+$/u;
    if (firstName.trim().length > 30 || lastName.trim().length > 30) {
      Toast.show({ type: "error", text1: "Champs invalides", text2: STRINGS.toast.nameTooLong }); return;
    }
    if (!nameRegex.test(firstName.trim()) || !nameRegex.test(lastName.trim())) {
      Toast.show({ type: "error", text1: "Champs invalides", text2: STRINGS.toast.nameInvalidChars }); return;
    }
    if (username.trim().length > 30) {
      Toast.show({ type: "error", text1: "Champs invalides", text2: STRINGS.toast.usernameTooLong }); return;
    }
    if (!usernameRegex.test(username.trim())) {
      Toast.show({ type: "error", text1: "Champs invalides", text2: STRINGS.toast.usernameInvalidChars }); return;
    }
    if (password !== confirm) {
      Toast.show({ type: "error", text1: STRINGS.toast.passwordMismatchTitle, text2: STRINGS.toast.passwordMismatch }); return;
    }
    setLoading(true);
    try {
      await register({ email: email.trim(), username: username.trim(), firstName: firstName.trim(), lastName: lastName.trim(), password });
      Toast.show({ type: "success", text1: STRINGS.toast.registerSuccessTitle, text2: STRINGS.toast.registerSuccess });
      router.replace("/login");
    } catch (e: unknown) {
      Toast.show({ type: "error", text1: STRINGS.toast.registerFailedTitle, text2: e instanceof Error ? e.message : STRINGS.api.genericError });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={[styles.hero, { paddingTop: insets.top + 24 }]}>
          <Logo size={58} />
          <Text style={styles.appName}>CityCare+</Text>
        </View>

        {/* ── Form card ── */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Créer un compte</Text>
          <Text style={styles.formSub}>Rejoignez la communauté CityCare</Text>

          {/* ── Identité ── */}
          <SectionHeader title="Identité" colors={colors} />
          <View style={styles.row}>
            <View style={styles.rowField}>
              <Input
                label="Prénom"
                placeholder="Jean"
                autoCapitalize="words"
                autoCorrect={false}
                icon="person"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={styles.rowField}>
              <Input
                label="Nom"
                placeholder="Dupont"
                autoCapitalize="words"
                autoCorrect={false}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          {/* ── Compte ── */}
          <SectionHeader title="Compte" colors={colors} />
          <Input
            label="Email"
            placeholder="jean@mail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            icon="email"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Nom d'utilisateur"
            placeholder="jean.dupont"
            autoCapitalize="none"
            autoCorrect={false}
            icon="alternate-email"
            value={username}
            onChangeText={setUsername}
          />

          {/* ── Sécurité ── */}
          <SectionHeader title="Sécurité" colors={colors} />
          <Input
            label="Mot de passe"
            placeholder="••••••••"
            secureTextEntry
            icon="lock"
            value={password}
            onChangeText={setPassword}
          />

          {/* Indicateur de force */}
          {password.length > 0 && (
            <View style={styles.strengthRow}>
              <View style={styles.strengthBars}>
                {([1, 2, 3] as const).map((lvl) => (
                  <View
                    key={lvl}
                    style={[
                      styles.strengthBar,
                      { backgroundColor: strength.score >= lvl ? strength.color : colors.inputBorder },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
          )}

          <Input
            label="Confirmer le mot de passe"
            placeholder="••••••••"
            secureTextEntry
            icon="lock-outline"
            value={confirm}
            onChangeText={setConfirm}
            error={confirmMismatch ? "Les mots de passe ne correspondent pas" : undefined}
          />

          <Button
            label="S'inscrire"
            onPress={handleRegister}
            loading={loading}
            disabled={confirmMismatch}
            style={styles.btnTop}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>déjà inscrit ?</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            label="Se connecter"
            variant="secondary"
            onPress={() => router.back()}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
