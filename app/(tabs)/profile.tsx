import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ROLE_COLORS, ROLE_LABELS } from "@/constants/roles";
import { DEBUG_NETWORK } from "@/constants/debug";
import { getTabBarScrollPadding } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { STRINGS } from "@/constants/strings";
import { deleteAccount, updateMe } from "@/services/users";
import { getValidToken } from "@/storage/tokens";
import { formatDate } from "@/utils/format-date";
import Constants from "expo-constants";
import { router } from "expo-router";
import { type ComponentProps, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Styles ────────────────────────────────────────────────────────────────────

function makeStyles(c: AppColors, bottomInset: number) {
  return StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.background },
    container: {
      flexGrow: 1,
      backgroundColor: c.background,
      alignItems: "center",
      padding: 20,
      paddingTop: 48,
      paddingBottom: getTabBarScrollPadding(bottomInset),
    },

    // ── Avatar ──
    avatarWrapper: { alignItems: "center", marginBottom: 32 },
    avatarRing: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: c.primary + "40",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontSize: 32, fontWeight: "800", color: "#fff" },
    fullName: { fontSize: 20, fontWeight: "700", color: c.text, marginBottom: 2 },
    usernameLabel: { fontSize: 14, color: c.text, opacity: 0.45, marginBottom: 10 },
    badge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
    badgeText: { color: "#fff", fontSize: 13, fontWeight: "700" },

    // ── Block header (accent bar + title) ──
    blockHeader: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 8,
      marginBottom: 10,
      marginTop: 8,
    },
    blockAccent: {
      width: 3,
      height: 18,
      borderRadius: 2,
      backgroundColor: c.primary,
    },
    blockTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: c.text,
    },

    // ── Cards ──
    card: { width: "100%", marginBottom: 8, padding: 0 },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: c.secondary },

    // ── Info rows (display, 2-line layout with icon) ──
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 13,
      paddingHorizontal: 16,
      width: "100%",
    },
    infoIcon: { marginRight: 14 },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 12, color: c.text, opacity: 0.45, marginBottom: 3 },
    infoValue: { fontSize: 15, color: c.text, fontWeight: "600" },

    // ── Settings rows (tappable) ──
    settingsRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 15,
      paddingHorizontal: 16,
      width: "100%",
    },
    settingsIcon: { marginRight: 14 },
    settingsLabel: { fontSize: 15, flex: 1 },
    chevron: { fontSize: 22, color: c.text, opacity: 0.2 },

    // ── Modal ──
    modalWrap: { flex: 1, backgroundColor: "#000a" },
    modalKav: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
    modalCard: { width: "100%", backgroundColor: c.background, borderRadius: 16, overflow: "hidden" },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.secondary,
    },
    modalTitle: { fontSize: 17, fontWeight: "700", color: c.text },
    modalCloseText: { fontSize: 20, color: c.text, opacity: 0.4, padding: 4 },
    modalBody: { padding: 20 },
    errorText: { color: "#e53e3e", fontSize: 13, marginBottom: 12 },

    version: { marginTop: 20, fontSize: 12, color: c.text, opacity: 0.3 },
  });
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { keycloakUser, dbUser, loading, logout, isAuthenticated, authError, refreshUser } = useAuth();
  const { colors } = useAppColors();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, bottomInset), [colors, bottomInset]);

  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace("/login");
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const initials =
    [keycloakUser?.firstName, keycloakUser?.lastName]
      .filter(Boolean)
      .map((s) => s![0].toUpperCase())
      .join("") ||
    keycloakUser?.username?.[0]?.toUpperCase() ||
    "?";

  const role = keycloakUser?.mainRole ?? null;
  const memberSince = dbUser?.createdAt ? formatDate(dbUser.createdAt) : null;

  const handleDelete = () => {
    Alert.alert(
      STRINGS.alert.deleteAccountTitle,
      STRINGS.alert.deleteAccountMsg,
      [
        { text: "Annuler", style: "cancel" },
        { text: STRINGS.alert.deleteAccountConfirm, style: "destructive", onPress: confirmDelete },
      ],
    );
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const token = await getValidToken();
      if (!token) throw new Error(STRINGS.api.sessionExpired);
      await deleteAccount(token);
      await logout();
    } catch (e) {
      Alert.alert(STRINGS.alert.errorTitle, e instanceof Error ? e.message : STRINGS.api.unknownError);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>

        {/* ── Avatar ── */}
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          {(keycloakUser?.firstName || keycloakUser?.lastName) && (
            <Text style={styles.fullName}>
              {[keycloakUser.firstName, keycloakUser.lastName].filter(Boolean).join(" ")}
            </Text>
          )}
          {keycloakUser?.username && (
            <Text style={styles.usernameLabel}>@{keycloakUser.username}</Text>
          )}
          {role && (
            <View style={[styles.badge, { backgroundColor: ROLE_COLORS[role] ?? colors.primary }]}>
              <Text style={styles.badgeText}>{ROLE_LABELS[role] ?? role}</Text>
            </View>
          )}
        </View>

        {/* ── Informations ── */}
        <BlockHeader title="Informations" styles={styles} />
        <Card style={styles.card}>
          <InfoRow icon="person" label="Prénom" value={keycloakUser?.firstName} styles={styles} colors={colors} />
          <InfoRow icon="badge" label="Nom" value={keycloakUser?.lastName} styles={styles} colors={colors} />
          <InfoRow icon="alternate-email" label="Nom d'utilisateur" value={keycloakUser?.username} styles={styles} colors={colors} />
          <InfoRow icon="email" label="Email" value={keycloakUser?.email} styles={styles} colors={colors} />
          {memberSince && (
            <InfoRow icon="event" label="Membre depuis" value={memberSince} last styles={styles} colors={colors} />
          )}
        </Card>

        {/* ── Mon compte ── */}
        <BlockHeader title="Mon compte" styles={styles} />
        <Card style={styles.card}>
          <SettingsRow
            label="Modifier mes informations"
            icon="edit"
            color={colors.primary}
            onPress={() => setEditOpen(true)}
            styles={styles}
          />
          <SettingsRow
            label="Changer le mot de passe"
            icon="lock"
            color={colors.primary}
            last
            onPress={() => setPasswordOpen(true)}
            styles={styles}
          />
        </Card>

        {/* ── Session ── */}
        <BlockHeader title="Session" styles={styles} />
        <Card style={styles.card}>
          <SettingsRow
            label="Se déconnecter"
            icon="logout"
            color={colors.primary}
            showChevron={false}
            last
            onPress={logout}
            styles={styles}
          />
        </Card>

        {/* ── Zone danger ── */}
        <BlockHeader title="Zone dangereuse" styles={styles} />
        <Card style={styles.card}>
          <SettingsRow
            label="Supprimer mon compte"
            icon="delete-forever"
            color="#e53e3e"
            showChevron={false}
            last
            loading={deleting}
            onPress={handleDelete}
            styles={styles}
          />
        </Card>

        <Text style={styles.version}>v {Constants.expoConfig?.version ?? "1.0.0"}</Text>
        {DEBUG_NETWORK && authError && (
          <Text selectable style={[styles.version, { color: "red", opacity: 1 }]}>{authError}</Text>
        )}
      </ScrollView>

      <EditProfileModal
        visible={editOpen}
        initialValues={{
          firstName: keycloakUser?.firstName ?? "",
          lastName: keycloakUser?.lastName ?? "",
          email: keycloakUser?.email ?? "",
          username: keycloakUser?.username ?? "",
        }}
        onClose={() => setEditOpen(false)}
        onSaved={async () => { setEditOpen(false); await refreshUser(); }}
        styles={styles}
      />

      <ChangePasswordModal
        visible={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        onSaved={() => setPasswordOpen(false)}
        styles={styles}
      />
    </>
  );
}

// ─── Block header ──────────────────────────────────────────────────────────────

function BlockHeader({
  title,
  styles,
}: {
  title: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.blockHeader}>
      <View style={styles.blockAccent} />
      <Text style={styles.blockTitle}>{title}</Text>
    </View>
  );
}

// ─── Info row (display, icon + 2-line label/value) ────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  last,
  styles,
  colors,
}: {
  icon: ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  value?: string | null;
  last?: boolean;
  styles: ReturnType<typeof makeStyles>;
  colors: AppColors;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.rowDivider]}>
      <MaterialIcons name={icon} size={20} color={colors.primary + "99"} style={styles.infoIcon} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value ?? "—"}</Text>
      </View>
    </View>
  );
}

// ─── Settings row (tappable) ──────────────────────────────────────────────────

function SettingsRow({
  label,
  icon,
  color,
  showChevron = true,
  last,
  loading,
  onPress,
  styles,
}: {
  label: string;
  icon: ComponentProps<typeof MaterialIcons>["name"];
  color: string;
  showChevron?: boolean;
  last?: boolean;
  loading?: boolean;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <TouchableOpacity
      style={[styles.settingsRow, !last && styles.rowDivider]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={loading}
    >
      <MaterialIcons name={icon} size={20} color={color} style={styles.settingsIcon} />
      {loading
        ? <ActivityIndicator color={color} size="small" style={{ flex: 1 }} />
        : <Text style={[styles.settingsLabel, { color, fontWeight: showChevron ? "400" : "600" }]}>{label}</Text>
      }
      {showChevron && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

// ─── Modal shell ───────────────────────────────────────────────────────────────

function ModalShell({
  visible,
  title,
  onClose,
  styles,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  styles: ReturnType<typeof makeStyles>;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.modalWrap}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalKav}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>{children}</View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Edit profile modal ────────────────────────────────────────────────────────

function EditProfileModal({
  visible,
  initialValues,
  onClose,
  onSaved,
  styles,
}: {
  visible: boolean;
  initialValues: { firstName: string; lastName: string; email: string; username: string };
  onClose: () => void;
  onSaved: () => Promise<void>;
  styles: ReturnType<typeof makeStyles>;
}) {
  const [firstName, setFirstName] = useState(initialValues.firstName);
  const [lastName, setLastName] = useState(initialValues.lastName);
  const [email, setEmail] = useState(initialValues.email);
  const [username, setUsername] = useState(initialValues.username);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setFirstName(initialValues.firstName);
      setLastName(initialValues.lastName);
      setEmail(initialValues.email);
      setUsername(initialValues.username);
      setError(null);
    }
  }, [visible, initialValues.firstName, initialValues.lastName, initialValues.email, initialValues.username]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !username.trim()) {
      setError(STRINGS.toast.missingFields);
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
    <ModalShell visible={visible} title="Modifier mes informations" onClose={onClose} styles={styles}>
      <Input label="Prénom" value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
      <Input label="Nom" value={lastName} onChangeText={setLastName} autoCapitalize="words" />
      <Input
        label="Nom d'utilisateur"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Button label="Enregistrer" onPress={handleSave} loading={loading} />
    </ModalShell>
  );
}

// ─── Change password modal ─────────────────────────────────────────────────────

function ChangePasswordModal({
  visible,
  onClose,
  onSaved,
  styles,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) { setNewPwd(""); setConfirm(""); setError(null); }
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
    <ModalShell visible={visible} title="Changer le mot de passe" onClose={onClose} styles={styles}>
      <Input label="Nouveau mot de passe" value={newPwd} onChangeText={setNewPwd} secureTextEntry />
      <Input label="Confirmer le mot de passe" value={confirm} onChangeText={setConfirm} secureTextEntry />
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Button label="Enregistrer" onPress={handleSave} loading={loading} />
    </ModalShell>
  );
}
