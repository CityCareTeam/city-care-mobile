import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ModalShell } from "@/components/ui/ModalShell";
import { STRINGS } from "@/constants/strings";
import { updateMe } from "@/services/users";
import { getValidToken } from "@/storage/tokens";
import { useEffect, useState } from "react";
import { Text } from "react-native";

type InitialValues = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
};

type Props = {
  visible: boolean;
  initialValues: InitialValues;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

const errorStyle = { color: "#e53e3e", fontSize: 13, marginBottom: 12 } as const;

const nameRegex = /^[\p{L} \-'.]+$/u;
const usernameRegex = /^[\p{L}\p{N}._\-]+$/u;

export function EditProfileModal({ visible, initialValues, onClose, onSaved }: Props) {
  const [firstName, setFirstName] = useState(initialValues.firstName);
  const [lastName, setLastName] = useState(initialValues.lastName);
  const [email, setEmail] = useState(initialValues.email);
  const [username, setUsername] = useState(initialValues.username);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setFirstName(initialValues.firstName);
    setLastName(initialValues.lastName);
    setEmail(initialValues.email);
    setUsername(initialValues.username);
    setError(null);
  }, [visible, initialValues.firstName, initialValues.lastName, initialValues.email, initialValues.username]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !username.trim()) {
      setError(STRINGS.toast.missingFields);
      return;
    }
    if (firstName.trim().length > 30 || lastName.trim().length > 30) {
      setError(STRINGS.toast.nameTooLong);
      return;
    }
    if (!nameRegex.test(firstName.trim()) || !nameRegex.test(lastName.trim())) {
      setError(STRINGS.toast.nameInvalidChars);
      return;
    }
    if (username.trim().length > 30) {
      setError(STRINGS.toast.usernameTooLong);
      return;
    }
    if (!usernameRegex.test(username.trim())) {
      setError(STRINGS.toast.usernameInvalidChars);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await getValidToken();
      if (!token) throw new Error(STRINGS.api.sessionExpired);
      await updateMe(token, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        username: username.trim(),
      });
      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : STRINGS.api.unknownError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell visible={visible} title="Modifier mes informations" onClose={onClose}>
      <Input label="Prénom" value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
      <Input label="Nom" value={lastName} onChangeText={setLastName} autoCapitalize="words" />
      <Input label="Nom d'utilisateur" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} />
      <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      {error && <Text style={errorStyle}>{error}</Text>}
      <Button label="Enregistrer" onPress={handleSave} loading={loading} />
    </ModalShell>
  );
}
