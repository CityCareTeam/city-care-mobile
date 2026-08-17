import { ModalShell } from "@/components/ui/ModalShell";
import { useAppColors } from "@/hooks/use-app-colors";
import { checkAndFetchUpdate, useAppUpdate, useRunningUpdate } from "@/hooks/use-app-update";
import { useStrings } from "@/hooks/use-strings";
import { baseVersion, buildLabel } from "@/utils/app-version";
import { mixHex } from "@/utils/color";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Updates from "expo-updates";
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Status = "idle" | "checking" | "up-to-date" | "downloaded" | "unavailable" | "failed";

type Icon = React.ComponentProps<typeof MaterialIcons>["name"];

const SUCCESS = "#4caf50";
const DANGER = "#e53e3e";

/**
 * État des mises à jour, et bouton pour en chercher une.
 *
 * La bannière automatique ne se montre qu'au moment où une mise à jour finit
 * d'arriver. Qui n'était pas devant l'écran à cet instant n'a aucun moyen de
 * savoir où il en est — c'est ce que cet écran répare. Il dit ce qui tourne, et
 * permet de demander explicitement.
 */
export function UpdatesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, isDark } = useAppColors();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const [status, setStatus] = useState<Status>("idle");
  const { ready, applying, apply } = useAppUpdate();
  const bundle = useRunningUpdate();
  const t = useStrings();

  async function check() {
    setStatus("checking");
    setStatus(await checkAndFetchUpdate());
  }

  const pending = ready || status === "downloaded";
  const checking = status === "checking";
  const broken = status === "failed" || status === "unavailable";

  /**
   * L'état a désormais une couleur, et c'est le vrai apport de cette
   * mise en forme : la bande était orange en toutes circonstances, si bien
   * qu'« à jour », « mise à jour prête » et « recherche impossible » se
   * ressemblaient. Le vert dit qu'il n'y a rien à faire, l'orange qu'il y a
   * quelque chose à faire, le rouge que ça n'a pas marché.
   */
  const tone = broken ? DANGER : pending || checking ? colors.primary : SUCCESS;

  const icon: Icon = pending
    ? "system-update"
    : status === "failed"
      ? "cloud-off"
      : status === "unavailable"
        ? "info-outline"
        : "check-circle";

  const title = checking
    ? t.updates.checking
    : pending
      ? t.updates.ready
      : status === "failed"
        ? t.updates.failedTitle
        : status === "unavailable"
          ? t.updates.unavailableTitle
          : t.updates.upToDateTitle;

  const detail = checking
    ? t.updates.checkingDetail
    : pending
      ? t.updates.applyHint
      : status === "up-to-date"
        ? t.updates.upToDate
        : status === "failed"
          ? t.updates.failed
          : status === "unavailable"
            ? t.updates.unavailable
            : t.updates.none;

  return (
    <ModalShell visible={visible} title={t.updates.title} onClose={onClose}>
      {/* La même bande teintée que les en-têtes de notifications et d'actus, au
          lieu d'une icône centrée sur du vide : la fenêtre cesse d'avoir l'air
          d'appartenir à une autre application. La teinte est calculée et non
          superposée — un fond translucide laisse voir les ombres à travers sur
          Android. */}
      <View style={[styles.state, { backgroundColor: mixHex(colors.white, tone, 0.14) }]}>
        <View style={[styles.bubble, { backgroundColor: tone }]}>
          {checking ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons name={icon} size={24} color="#fff" />
          )}
        </View>
        <View style={styles.stateText}>
          <Text style={styles.stateTitle}>{title}</Text>
          <Text style={styles.stateDetail}>{detail}</Text>
        </View>
      </View>

      {/* Trois faits techniques, mais de trois natures différentes : une
          version, un identifiant, une catégorie. Les rendre tous en texte gris
          aligné à droite obligeait à les lire un par un pour comprendre lequel
          on regardait. Chacun a maintenant la forme de ce qu'il est. */}
      <View style={styles.rows}>
        <Row icon="label" label={t.updates.installedVersion} styles={styles}>
          <Text style={styles.value}>{baseVersion()}</Text>
          {/* Le rang de pré-version compte les APK. Il mérite d'être lisible
              séparément : c'est lui qu'on compare entre deux appareils de test,
              pas le « 1.6.0 » qu'ils ont en commun. */}
          {buildLabel() ? (
            <View style={styles.buildChip}>
              <Text style={styles.buildChipText}>{buildLabel()}</Text>
            </View>
          ) : null}
        </Row>

        <Row icon="layers" label={t.updates.runningBundle} styles={styles}>
          {bundle ? (
            // Un identifiant, donc présenté comme tel : chiffres à largeur
            // fixe sur fond teinté, pour se comparer d'un coup d'œil à ce qu'on
            // vient de publier.
            <View style={styles.codeChip}>
              <Text style={styles.codeChipText}>{bundle}</Text>
            </View>
          ) : (
            // Sans identifiant, c'est celui livré avec l'application : le dire
            // vaut mieux qu'un tiret, qui se lit comme une donnée manquante.
            <Text style={styles.muted}>{t.updates.embedded}</Text>
          )}
        </Row>

        <Row icon="alt-route" label={t.updates.channel} styles={styles} last>
          {Updates.channel ? (
            // Le fait le plus utile du panneau : sur quel canal cet appareil
            // est branché. Une pastille colorée le dit sans le lire.
            <View style={[styles.channelPill, { backgroundColor: channelColor(Updates.channel, colors.primary) }]}>
              <Text style={styles.channelText}>{Updates.channel}</Text>
            </View>
          ) : (
            <Text style={styles.muted}>{t.updates.noChannel}</Text>
          )}
        </Row>
      </View>

      <TouchableOpacity
        style={[styles.action, { backgroundColor: pending ? colors.primary : mixHex(colors.white, colors.primary, 0.12) }]}
        onPress={() => void (pending ? apply() : check())}
        disabled={applying || checking}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={pending ? t.updates.relaunch : t.updates.check}
      >
        {applying || checking ? (
          <ActivityIndicator size="small" color={pending ? "#fff" : colors.primary} />
        ) : (
          <>
            <MaterialIcons
              name={pending ? "restart-alt" : "refresh"}
              size={18}
              color={pending ? "#fff" : colors.primary}
            />
            {/* Rechercher est une action ordinaire, relancer une action qu'on
                vient d'annoncer : la première reste discrète, la seconde est
                pleine. Sans cette différence les deux se valaient à l'œil, et
                le bouton n'appelait jamais l'appui. */}
            <Text style={[styles.actionLabel, { color: pending ? "#fff" : colors.primary }]}>
              {pending ? t.updates.relaunch : t.updates.check}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ModalShell>
  );
}

/**
 * Couleur d'un canal.
 *
 * `beta` reprend la couleur de l'application, `rc` le bleu des états en cours
 * et `production` le vert des états résolus : la progression se lit dans la
 * teinte, du chantier au livré. Un canal inconnu prend le gris plutôt qu'une
 * couleur inventée qui laisserait croire à un sens.
 */
function channelColor(channel: string, primary: string): string {
  if (channel === "production") return "#4caf50";
  if (channel === "rc") return "#2196f3";
  if (channel === "beta") return primary;
  return "#78909c";
}

function Row({
  icon,
  label,
  last = false,
  styles,
  children,
}: {
  icon: Icon;
  label: string;
  last?: boolean;
  styles: ReturnType<typeof makeStyles>;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <MaterialIcons name={icon} size={15} color={styles.rowLabel.color} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValue}>{children}</View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useAppColors>["colors"], isDark: boolean) {
  return StyleSheet.create({
    state: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      padding: 14,
      borderRadius: 20,
      marginBottom: 16,
    },
    bubble: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: "center",
      justifyContent: "center",
    },
    stateText: { flex: 1, gap: 2 },
    stateTitle: { fontSize: 15.5, fontWeight: "800", color: colors.text, letterSpacing: -0.2 },
    stateDetail: { fontSize: 12.5, color: colors.text, opacity: 0.6, lineHeight: 17 },

    rows: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.chipBorder,
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : colors.chipBg,
      marginBottom: 16,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      paddingHorizontal: 13,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.chipBorder,
    },
    rowLast: { borderBottomWidth: 0 },
    rowIcon: { opacity: 0.75 },
    rowLabel: { flex: 1, fontSize: 13, color: colors.text, opacity: 0.6 },
    rowValue: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },

    value: {
      fontSize: 13.5,
      fontWeight: "700",
      color: colors.text,
      fontVariant: ["tabular-nums"],
    },
    muted: { fontSize: 13, color: colors.text, opacity: 0.45 },

    buildChip: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 7,
      backgroundColor: mixHex(colors.white, colors.primary, 0.16),
    },
    buildChipText: {
      fontSize: 11,
      fontWeight: "800",
      color: colors.primary,
      letterSpacing: 0.2,
    },

    codeChip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 7,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
    },
    codeChipText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
      opacity: 0.8,
      // Un identifiant se compare caractère par caractère : chiffres à largeur
      // fixe, et de l'air entre les lettres.
      fontVariant: ["tabular-nums"],
      letterSpacing: 1,
    },

    channelPill: {
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 9,
    },
    channelText: {
      fontSize: 11,
      fontWeight: "800",
      color: "#fff",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },

    action: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 16,
      paddingVertical: 13,
      minHeight: 48,
    },
    actionLabel: { fontSize: 14, fontWeight: "700" },
  });
}
