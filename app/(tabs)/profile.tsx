import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CityCareColors } from "@/constants/theme";
import Constants from "expo-constants";
import { getMe, logout } from "@/services/auth";
import { getUserMe } from "@/services/users";
import { clearTokens, getAccessToken, getRefreshToken } from "@/storage/tokens";
import type { MeResponse } from "@/types/auth";
import type { UserMeResponse } from "@/types/users";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

const ROLE_LABELS: Record<string, string> = {
  Admin: "Administrateur",
  Agent: "Agent municipal",
  Citizen: "Citoyen",
};

const ROLE_COLORS: Record<string, string> = {
  Admin: CityCareColors.statusRed,
  Agent: CityCareColors.primary,
  Citizen: CityCareColors.statusGreen,
};

export default function ProfileScreen() {
  const [keycloakUser, setKeycloakUser] = useState<MeResponse | null>(null);
  const [dbUser, setDbUser] = useState<UserMeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = await getAccessToken();
      if (!token) {
        router.replace("/login");
        return;
      }
      try {
        const [kc, db] = await Promise.all([getMe(token), getUserMe(token)]);
        setKeycloakUser(kc);
        setDbUser(db);
      } catch {
        await clearTokens();
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleLogout() {
    const token = await getRefreshToken();
    if (token) await logout(token);
    await clearTokens();
    router.replace("/login");
  }

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
  const memberSince = dbUser?.createdAt
    ? new Date(dbUser.createdAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

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
        onPress={handleLogout}
        style={styles.btn}
      />
      <Text style={styles.version}>v {Constants.expoConfig?.version ?? "1.0.0"}</Text>
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
