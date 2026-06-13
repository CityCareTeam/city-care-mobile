import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ModalShell } from "@/components/ui/ModalShell";
import { STRINGS } from "@/constants/strings";
import { updateMe } from "@/services/users";
import { getValidToken } from "@/storage/tokens";
import { useEffect, useState } from "react";
import { Alert, Text } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const errorStyle = { color: "#e53e3e", fontSize: 13, marginBottom: 12 } as const;

export function ChangePasswordModal({ visible, onClose, onSaved }: Props) {
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

  const handleSave = async () => {
    if (!newPwd || !confirm) { setError(STRINGS.toast.missingFields); return; }
    if (newPwd !== confirm) { setError(STRINGS.toast.passwordMismatch); return; }
    if (newPwd.length < 8) { setError(STRINGS.toast.passwordTooShort); return; }
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

  return (
    <ModalShell visible={visible} title="Changer le mot de passe" onClose={onClose}>
      <Input label="Nouveau mot de passe" value={newPwd} onChangeText={setNewPwd} secureTextEntry />
      <Input label="Confirmer le mot de passe" value={confirm} onChangeText={setConfirm} secureTextEntry />
      {error && <Text style={errorStyle}>{error}</Text>}
      <Button label="Enregistrer" onPress={handleSave} loading={loading} />
    </ModalShell>
  );
}
