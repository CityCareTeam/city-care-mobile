import { checkAndFetchUpdate } from "@/hooks/use-app-update";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Updates from "expo-updates";
import { Component, useMemo, useState, type ReactNode } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/AppText";

type Props = { children: ReactNode };
type State = { error: Error | null; attempt: number };

/**
 * Garde-fou de rendu.
 *
 * Sans lui, une erreur levée pendant le rendu de n'importe quel écran démonte
 * l'arbre entier : l'application disparaît, sans message et sans recours. C'est
 * d'autant plus gênant qu'elle se met à jour à la volée — une publication qui
 * lève laisserait chaque appareil devant un écran mort, sans même l'accès au
 * menu pour aller chercher la suivante.
 *
 * Il vit à l'intérieur du fournisseur de préférences, pas au-dessus : l'écran
 * de secours a besoin du thème et de la langue choisis. Ce qui casserait *dans*
 * ce fournisseur lui échappe donc — mais il ne fait que lire deux clés de
 * stockage, et le prix d'un écran de secours en anglais sur fond blanc quoi
 * qu'on ait choisi serait payé par tout le monde, tous les jours.
 *
 * Une classe, parce que React ne propose `componentDidCatch` que là.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, attempt: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    // Rien ne collecte encore les erreurs à distance. Le journal de l'appareil
    // est le seul endroit où celle-ci laissera une trace exploitable — et la
    // pile de composants dit quel écran a lâché, ce que le message tait.
    console.error("[crash]", error?.message, info?.componentStack ?? "");
  }

  render() {
    if (!this.state.error) {
      // La clé remonte à chaque tentative : sans elle, React réutilise
      // l'arbre précédent et l'écran fautif se réaffiche dans l'état où il a
      // échoué.
      return <View key={this.state.attempt} style={styles.host}>{this.props.children}</View>;
    }

    return (
      <ErrorScreen
        error={this.state.error}
        onRetry={() => this.setState((s) => ({ error: null, attempt: s.attempt + 1 }))}
      />
    );
  }
}

const styles = StyleSheet.create({ host: { flex: 1 } });

type Fetching = "idle" | "checking" | "found" | "none" | "failed";

/**
 * L'écran de secours.
 *
 * Deux issues, et la seconde est la vraie raison d'être de cet écran. Réessayer
 * remonte l'arbre, ce qui suffit pour une erreur de passage. Mais si c'est le
 * bundle en cours qui est fautif, réessayer le rejouera indéfiniment : il faut
 * pouvoir en télécharger un autre depuis ici. C'est la seule porte de sortie
 * d'une mauvaise mise à jour, à part réinstaller.
 */
function ErrorScreen({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const { colors } = useAppColors();
  const t = useStrings();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [fetching, setFetching] = useState<Fetching>("idle");

  const lookForFix = async () => {
    setFetching("checking");
    const result = await checkAndFetchUpdate();
    if (result === "downloaded") {
      setFetching("found");
      await Updates.reloadAsync().catch(() => setFetching("failed"));
      return;
    }
    setFetching(result === "up-to-date" ? "none" : "failed");
  };

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.bubble}>
          <MaterialIcons name="error-outline" size={34} color={colors.primary} />
        </View>

        <Text style={s.title}>{t.crash.title}</Text>
        <Text style={s.detail}>{t.crash.detail}</Text>

        {/* Le message technique, lisible mais discret : il ne sert à rien à
            l'utilisateur, et il est tout ce qu'on aura pour comprendre s'il
            pense à le recopier. */}
        {error?.message ? <Text style={s.technical}>{error.message}</Text> : null}

        <TouchableOpacity style={s.primaryBtn} onPress={onRetry} activeOpacity={0.85}>
          <MaterialIcons name="refresh" size={18} color="#fff" />
          <Text style={s.primaryLabel}>{t.crash.retry}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.secondaryBtn}
          onPress={() => void lookForFix()}
          disabled={fetching === "checking" || fetching === "found"}
          activeOpacity={0.7}
        >
          {fetching === "checking" || fetching === "found" ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <MaterialIcons name="system-update" size={17} color={colors.primary} />
          )}
          <Text style={s.secondaryLabel}>
            {fetching === "found" ? t.crash.applying : t.crash.lookForFix}
          </Text>
        </TouchableOpacity>

        {fetching === "none" && <Text style={s.status}>{t.crash.noFix}</Text>}
        {fetching === "failed" && <Text style={s.status}>{t.crash.checkFailed}</Text>}
      </ScrollView>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useAppColors>["colors"]) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    content: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 },
    bubble: {
      width: 78,
      height: 78,
      borderRadius: 39,
      backgroundColor: c.secondary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    title: { fontSize: 21, fontWeight: "800", color: c.text, textAlign: "center", letterSpacing: -0.3 },
    detail: {
      fontSize: 14,
      color: c.text,
      opacity: 0.6,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 4,
    },
    technical: {
      fontSize: 11,
      color: c.text,
      opacity: 0.35,
      textAlign: "center",
      marginBottom: 10,
    },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: c.primary,
      paddingHorizontal: 22,
      paddingVertical: 13,
      borderRadius: 24,
    },
    primaryLabel: { fontSize: 15, fontWeight: "700", color: "#fff" },
    secondaryBtn: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 10 },
    secondaryLabel: { fontSize: 13, fontWeight: "600", color: c.primary },
    status: { fontSize: 12, color: c.text, opacity: 0.5, textAlign: "center" },
  });
}
