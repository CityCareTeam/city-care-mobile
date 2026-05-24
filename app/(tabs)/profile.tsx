import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ROLE_COLORS, ROLE_LABELS } from "@/constants/roles";
import { CityCareColors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/utils/format-date";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useEffect } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";


export default function ProfileScreen() {
  const { keycloakUser, dbUser, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !keycloakUser) {
      router.replace("/login");
    }
  }, [loading, keycloakUser]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={CityCareColors.primary} size="large" />
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatarWrapper}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        {role && (
          <View
            style={[
              styles.badge,
              { backgroundColor: ROLE_COLORS[role] ?? CityCareColors.primary },
            ]}
          >
            <Text style={styles.badgeText}>{ROLE_LABELS[role] ?? role}</Text>
          </View>
        )}
      </View>

      <Card style={styles.card}>
        <Row label="Prénom" value={keycloakUser?.firstName} />
        <Row label="Nom" value={keycloakUser?.lastName} />
        <Row label="Nom d'utilisateur" value={keycloakUser?.username} />
        <Row label="Email" value={keycloakUser?.email} />
        {memberSince && <Row label="Membre depuis" value={memberSince} last />}
      </Card>

      <Button
        label="Se déconnecter"
        variant="secondary"
        onPress={logout}
        style={styles.btn}
      />
      <Text style={styles.version}>
        v {Constants.expoConfig?.version ?? "1.0.0"}
      </Text>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  last,
}: {
  label: string;
  value?: string | null;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value ?? "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CityCareColors.background,
  },
  container: {
    flexGrow: 1,
    backgroundColor: CityCareColors.background,
    alignItems: "center",
    padding: 24,
    paddingTop: 48,
  },
  avatarWrapper: { alignItems: "center", marginBottom: 28 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: CityCareColors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: "800", color: "#fff" },
  badge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  badgeText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  card: { width: "100%", marginBottom: 24, padding: 0 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: "100%",
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#f0ede0" },
  rowLabel: {
    fontSize: 14,
    color: CityCareColors.text,
    opacity: 0.55,
    flex: 1,
  },
  rowValue: {
    fontSize: 14,
    color: CityCareColors.text,
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
  },
  btn: { width: "100%" },
  version: {
    marginTop: 16,
    fontSize: 12,
    color: CityCareColors.text,
    opacity: 0.35,
  },
});
