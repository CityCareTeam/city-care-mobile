import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { Toast } from "@/components/ui/ToastMessage";
import { STRINGS } from "@/constants/strings";
import { API_BASE_URL, API_ENDPOINTS } from "@/constants/api";
import { DEBUG_NETWORK } from "@/constants/config";
import { useAppColors } from "@/hooks/use-app-colors";
import { login } from "@/services/auth";
import { saveTokens } from "@/storage/tokens";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { AppColors } from "@/hooks/use-app-colors";

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.primary },
    hero: {
      alignItems: "center",
      paddingHorizontal: 24,
      paddingBottom: 36,
      gap: 6,
    },
    appName: {
      fontSize: 32,
      fontWeight: "900",
      color: "#fff",
      letterSpacing: 0.5,
    },
    tagline: {
      fontSize: 14,
      color: "rgba(255,255,255,0.65)",
      fontWeight: "500",
    },
    formCard: {
      flexGrow: 1,
      backgroundColor: c.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 28,
      paddingTop: 32,
    },
    formTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: c.text,
      marginBottom: 24,
    },
    forgotBtn: {
      alignSelf: "flex-end",
      marginTop: -8,
      marginBottom: 16,
      paddingVertical: 4,
    },
    forgotText: {
      fontSize: 13,
      color: c.primary,
      fontWeight: "600",
    },
    btnTop: { marginTop: 8, marginBottom: 12 },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: c.inputBorder },
    dividerText: { fontSize: 12, color: c.text, opacity: 0.35, fontWeight: "500" },
    version: { marginTop: 24, fontSize: 12, color: c.text, opacity: 0.3, textAlign: "center" },
    debug: { marginTop: 4, fontSize: 10, color: c.text, opacity: 0.4, fontFamily: "monospace" },
  });
}

export default function LoginScreen() {
  const { colors } = useAppColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugError, setDebugError] = useState("");
  const [debugInfo, setDebugInfo] = useState<{ status?: number; duration?: number } | null>(null);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      Toast.show({ type: "error", text1: STRINGS.toast.missingFieldsTitle, text2: STRINGS.toast.missingFields });
      return;
    }
    setLoading(true);
    setDebugError("");
    setDebugInfo(null);
    const t0 = Date.now();
    try {
      const tokens = await login({ username: username.trim(), password });
      if (DEBUG_NETWORK) setDebugInfo({ status: 200, duration: Date.now() - t0 });
      await saveTokens(tokens.accessToken, tokens.refreshToken);
      router.replace("/(tabs)");
    } catch (e: unknown) {
      if (DEBUG_NETWORK) setDebugInfo({ duration: Date.now() - t0 });
      setDebugError(String(e));
      Toast.show({ type: "error", text1: STRINGS.toast.loginFailedTitle, text2: e instanceof Error ? e.message : STRINGS.api.genericError });
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
        <View style={[styles.hero, { paddingTop: insets.top + 36 }]}>
          <Logo size={82} />
          <Text style={styles.appName}>CityCare+</Text>
          <Text style={styles.tagline}>Signalez, suivez, améliorez votre ville</Text>
        </View>

        {/* ── Form card ── */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Connexion</Text>

          <Input
            label="Email ou nom d'utilisateur"
            placeholder="jean.dupont ou jean@mail.com"
            autoCapitalize="none"
            autoCorrect={false}
            icon="person"
            value={username}
            onChangeText={setUsername}
          />
          <Input
            label="Mot de passe"
            placeholder="••••••••"
            secureTextEntry
            icon="lock"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => Toast.show({ type: "success", text1: "Bientôt disponible", text2: "La réinitialisation du mot de passe arrive prochainement." })}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <Button label="Se connecter" onPress={handleLogin} loading={loading} style={styles.btnTop} />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            label="Créer un compte"
            variant="secondary"
            onPress={() => router.push("/register")}
            disabled={loading}
          />

          <Text style={styles.version}>v {Constants.expoConfig?.version ?? "1.0.0"}</Text>

          {DEBUG_NETWORK && (
            <>
              <Text style={styles.debug}>API: {API_BASE_URL}</Text>
              <Text style={styles.debug}>POST {API_ENDPOINTS.login}</Text>
              {debugInfo && (
                <Text style={styles.debug}>
                  {debugInfo.status ? `HTTP ${debugInfo.status} · ` : ""}{debugInfo.duration}ms
                </Text>
              )}
              {debugError ? (
                <Text selectable style={[styles.debug, { color: "red", opacity: 1 }]}>{debugError}</Text>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
