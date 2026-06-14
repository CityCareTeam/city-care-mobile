import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ModalShell } from "@/components/ui/ModalShell";
import { STRINGS } from "@/constants/strings";
import { useAppColors } from "@/hooks/use-app-colors";
import { getStrength } from "@/utils/password-strength";
import { updateMe } from "@/services/users";
import { getValidToken } from "@/storage/tokens";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function ChangePasswordModal({ visible, onClose, onSaved }: Props) {
  const { colors } = useAppColors();
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setNewPwd("");
    setConfirm("");
    setError(null);
  }, [visible]);

  const strength = getStrength(newPwd);
  const confirmMismatch = confirm.length > 0 && confirm !== newPwd;

  const handleSave = async () => {
    if (!newPwd || !confirm) { setError(STRINGS.toast.missingFields); return; }
    if (newPwd !== confirm)  { setError(STRINGS.toast.passwordMismatch); return; }
    if (newPwd.length < 8)  { setError(STRINGS.toast.passwordTooShort); return; }
    setLoading(true);
    setError(null);
    try {
      const token = await getValidToken();
      if (!token) throw new Error(STRINGS.api.sessionExpired);
      await updateMe(token, { newPassword: newPwd });
      Alert.alert(STRINGS.alert.passwordChangedTitle, STRINGS.alert.passwordChangedMsg);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : STRINGS.api.unknownError);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    strengthRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: -10, marginBottom: 16 },
    strengthBars: { flexDirection: "row", gap: 4, flex: 1 },
    strengthBar: { flex: 1, height: 3, borderRadius: 2 },
    strengthLabel: { fontSize: 11, fontWeight: "700", minWidth: 36, textAlign: "right" },
    errorText: { color: "#e53e3e", fontSize: 13, marginBottom: 12 },
  });

  return (
    <ModalShell visible={visible} title="Changer le mot de passe" onClose={onClose}>
      <Input
        label="Nouveau mot de passe"
        icon="lock"
        value={newPwd}
        onChangeText={setNewPwd}
        secureTextEntry
      />

      {newPwd.length > 0 && (
        <View style={styles.strengthRow}>
          <View style={styles.strengthBars}>
            {([1, 2, 3] as const).map((lvl) => (
              <View
                key={lvl}
                style={[styles.strengthBar, { backgroundColor: strength.score >= lvl ? strength.color : colors.inputBorder }]}
              />
            ))}
          </View>
          <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
        </View>
      )}

      <Input
        label="Confirmer le mot de passe"
        icon="lock-outline"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        error={confirmMismatch ? "Les mots de passe ne correspondent pas" : undefined}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}
      <Button label="Enregistrer" onPress={handleSave} loading={loading} disabled={confirmMismatch} />
    </ModalShell>
  );
}
