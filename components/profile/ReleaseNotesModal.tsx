import { ModalShell } from "@/components/ui/ModalShell";
import { CHANGE_KIND } from "@/constants/changelog";
import type { ReleaseGroup, ReleaseNote } from "@/types/changelog";
import { baseVersion, minorOf, releaseTag } from "@/utils/app-version";
import {
  changelogFor,
  changesByKind,
  countsByKind,
  groupByMinor,
  isReleased,
} from "@/utils/changelog";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { Text } from "@/components/ui/AppText";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Styles = ReturnType<typeof makeStyles>;

/** Largeur de la gouttière qui porte le rail et les pastilles. */
const RAIL = 26;

function parseISO(iso: string): Date | null {
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(iso: string, locale: string): string {
  const date = parseISO(iso);
  if (!date) return "";
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Étendue d'un palier : « juin » si tout tient dans le mois, « juin → août » sinon. */
function formatSpan(group: ReleaseGroup, locale: string): string {
  const newest = parseISO(group.releases[0]?.date ?? "");
  const oldest = parseISO(group.releases[group.releases.length - 1]?.date ?? "");
  if (!newest || !oldest) return "";

  const month = (d: Date) =>
    d.toLocaleDateString(locale, { month: "long", timeZone: "UTC" });
  const year = newest.getUTCFullYear();

  return month(oldest) === month(newest)
    ? `${month(newest)} ${year}`
    : `${month(oldest)} → ${month(newest)} ${year}`;
}

// ─── Une version, jalon secondaire du rail ────────────────────────────────────

function Release({ note, current, tag, styles, colors }: {
  note: ReleaseNote;
  current: string;
  tag: string | null;
  styles: Styles;
  colors: AppColors;
}) {
  const t = useStrings();
  const isCurrent = note.version === current;
  const released = isReleased(note.version);

  return (
    <View style={styles.release}>
      <View style={styles.releaseRail}>
        <View
          style={[
            styles.releaseDot,
            { borderColor: isCurrent ? colors.primary : colors.text + "33" },
            isCurrent && { backgroundColor: colors.primary },
          ]}
        />
      </View>

      <View style={styles.releaseBody}>
        <View style={styles.releaseHeader}>
          <Text style={styles.releaseVersion}>{note.version}</Text>

          {/* Une version sans tag git n'est pas livrée : le dire, plutôt que de
              la laisser passer pour une version en production. */}
          {!released && (
            <View style={[styles.pill, { backgroundColor: colors.primary + "1F" }]}>
              <Text style={[styles.pillText, { color: colors.primary }]}>
                {tag ? `${tag.toUpperCase()} · ${t.releaseNotes.upcoming}` : t.releaseNotes.upcoming}
              </Text>
            </View>
          )}
          {isCurrent && (
            <View style={[styles.pill, styles.pillNeutral]}>
              <Text style={styles.pillNeutralText}>{t.releaseNotes.yourVersion}</Text>
            </View>
          )}

          <View style={styles.spacer} />
          <Text style={styles.releaseDate}>{formatDate(note.date, t.locale)}</Text>
        </View>

        {note.headline && <Text style={styles.headline}>{note.headline}</Text>}

        {/* Regroupé par nature : dix lignes commençant chacune par
            « Corrigé » se lisent mal ; trois sections courtes se parcourent. */}
        <View style={styles.sections}>
          {changesByKind(note).map(({ kind, changes }) => {
            const meta = CHANGE_KIND[kind];
            return (
              <View key={kind} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: meta.color + "1F" }]}>
                    <MaterialIcons name={meta.icon} size={11} color={meta.color} />
                  </View>
                  <Text style={[styles.sectionLabel, { color: meta.color }]}>{meta.label}</Text>
                  <View style={[styles.sectionRule, { backgroundColor: meta.color + "26" }]} />
                </View>
                {changes.map((change, index) => (
                  <View key={index} style={styles.change}>
                    <View style={[styles.bullet, { backgroundColor: meta.color + "66" }]} />
                    <Text style={styles.changeText}>{change.text}</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── Un palier mineur, jalon principal du rail ────────────────────────────────

function Milestone({ group, current, tag, expanded, onToggle, styles, colors }: {
  group: ReleaseGroup;
  current: string;
  tag: string | null;
  expanded: boolean;
  onToggle: () => void;
  styles: Styles;
  colors: AppColors;
}) {
  const t = useStrings();
  const holdsCurrent = minorOf(current) === group.minor;
  const count = group.releases.length;

  return (
    <View style={styles.milestone}>
      <View style={styles.milestoneRail}>
        <View
          style={[
            styles.milestoneDot,
            { backgroundColor: holdsCurrent ? colors.primary : colors.white },
            { borderColor: holdsCurrent ? colors.primary : colors.text + "2E" },
          ]}
        />
      </View>

      <View
        style={[
          styles.card,
          expanded && styles.cardOpen,
          holdsCurrent && { borderLeftColor: colors.primary, borderLeftWidth: 2 },
        ]}
      >
      <TouchableOpacity
        style={styles.milestoneHeader}
        onPress={onToggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${t.releaseNotes.version(group.minor)}, ${t.releaseNotes.releases(count)}, ${formatSpan(group, t.locale)}`}
      >
        <View style={styles.milestoneBody}>
          <View style={styles.milestoneTitleRow}>
            <Text style={styles.milestoneTitle}>{t.releaseNotes.version(group.minor)}</Text>
            <View style={styles.spacer} />
            <MaterialIcons
              name={expanded ? "expand-less" : "expand-more"}
              size={20}
              color={colors.text + "59"}
            />
          </View>
          <Text style={styles.milestoneMeta}>
            {formatSpan(group, t.locale)} · {t.releaseNotes.releases(count)}
          </Text>

          {/* La silhouette du palier se lit sans le déplier. */}
          <View style={styles.tallies}>
            {countsByKind(group).map(({ kind, count: total }) => {
              const meta = CHANGE_KIND[kind];
              return (
                <View
                  key={kind}
                  style={[styles.tally, { backgroundColor: meta.color + "16" }]}
                  accessibilityLabel={`${total} ${meta.label}`}
                >
                  <MaterialIcons name={meta.icon} size={10} color={meta.color} />
                  <Text style={[styles.tallyText, { color: meta.color }]}>{total}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.milestoneReleases}>
          {group.releases.map((note) => (
            <Release
              key={note.version}
              note={note}
              current={current}
              tag={tag}
              styles={styles}
              colors={colors}
            />
          ))}
        </View>
      )}
      </View>
    </View>
  );
}

// ─── Modale ───────────────────────────────────────────────────────────────────

export function ReleaseNotesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, isDark } = useAppColors();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const t = useStrings();

  const current = baseVersion();
  const tag = releaseTag();
  const groups = useMemo(() => groupByMinor(changelogFor(current)), [current]);

  // Le palier de la version installée est ouvert d'entrée : c'est celui qu'on
  // vient lire. Les autres attendent qu'on les demande.
  const [expanded, setExpanded] = useState<string | null>(() => minorOf(current));

  const toggle = (minor: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((open) => (open === minor ? null : minor));
  };

  return (
    <ModalShell visible={visible} title={t.releaseNotes.title} onClose={onClose}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tag && (
          <View style={[styles.banner, { backgroundColor: colors.primary + "14" }]}>
            <MaterialIcons name="science" size={16} color={colors.primary} />
            <Text style={styles.bannerText}>
              Vous utilisez une version d&apos;essai <Text style={{ color: colors.primary, fontWeight: "700" }}>{tag}</Text> de
              la {current}. Elle n&apos;est pas encore publiée.
            </Text>
          </View>
        )}

        <View style={styles.timeline}>
          {/* Rail continu, tracé derrière les jalons sur toute la hauteur. */}
          <View style={styles.rail} />
          {groups.map((group) => (
            <Milestone
              key={group.minor}
              group={group}
              current={current}
              tag={tag}
              expanded={expanded === group.minor}
              onToggle={() => toggle(group.minor)}
              styles={styles}
              colors={colors}
            />
          ))}
        </View>
      </ScrollView>
    </ModalShell>
  );
}

function makeStyles(c: AppColors, isDark: boolean) {
  const hairline = isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.09)";

  return StyleSheet.create({
    content: { padding: 16, paddingTop: 12 },
    spacer: { flex: 1 },

    // ── Bandeau pré-version ──
    banner: {
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
      padding: 12,
      borderRadius: 14,
      marginBottom: 16,
    },
    bannerText: { flex: 1, fontSize: 12, lineHeight: 17, color: c.text, opacity: 0.75 },

    // ── Rail ──
    timeline: { position: "relative" },
    // Le rail court dans la gouttière, à gauche des cartes, et s'arrête au
    // niveau du dernier jalon plutôt qu'au bas du contenu.
    rail: {
      position: "absolute",
      left: RAIL / 2 - 0.5,
      top: 20,
      bottom: 20,
      width: 1,
      backgroundColor: hairline,
    },

    // ── Jalon principal ──
    milestone: { flexDirection: "row", marginBottom: 10 },
    milestoneRail: { width: RAIL, alignItems: "center", paddingTop: 16 },
    milestoneDot: {
      width: 11,
      height: 11,
      borderRadius: 6,
      borderWidth: 2,
    },
    // Chaque palier est une carte : c'est ce qui sépare visuellement les 1.x
    // les uns des autres, là où une simple liste les faisait couler ensemble.
    card: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: hairline,
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.015)",
      paddingHorizontal: 12,
      overflow: "hidden",
    },
    cardOpen: {
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#00000008",
      borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.11)",
    },
    milestoneHeader: { flexDirection: "row", paddingVertical: 12 },
    milestoneBody: { flex: 1, gap: 2 },
    milestoneTitleRow: { flexDirection: "row", alignItems: "center" },
    milestoneTitle: { fontSize: 14, fontWeight: "700", color: c.text },
    milestoneMeta: {
      fontSize: 11,
      color: c.text,
      opacity: 0.38,
      textTransform: "capitalize",
    },
    milestoneReleases: { paddingBottom: 14, gap: 18 },

    // ── Jalon secondaire ──
    release: { flexDirection: "row" },
    // La gouttière des versions est décalée : le rail principal court dehors.
    releaseRail: { width: 16, alignItems: "center", paddingTop: 4 },
    releaseDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      borderWidth: 1.5,
      backgroundColor: c.white,
    },
    releaseBody: { flex: 1, gap: 2 },
    releaseHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
    releaseVersion: {
      fontSize: 13,
      fontWeight: "800",
      color: c.text,
      fontVariant: ["tabular-nums"],
    },
    releaseDate: { fontSize: 10, color: c.text, opacity: 0.3 },
    pill: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
    pillText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.3 },
    pillNeutral: { backgroundColor: isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)" },
    pillNeutralText: { fontSize: 9, fontWeight: "700", color: c.text, opacity: 0.55 },

    headline: { fontSize: 12, lineHeight: 17, color: c.text, opacity: 0.65, marginTop: 5 },

    // ── Compteurs du palier replié ──
    tallies: { flexDirection: "row", gap: 5, marginTop: 7 },
    tally: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      borderRadius: 7,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    tallyText: { fontSize: 10, fontWeight: "800", fontVariant: ["tabular-nums"] },

    // ── Changements, par nature ──
    sections: { gap: 12, marginTop: 10 },
    section: { gap: 6 },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
    sectionIcon: {
      width: 18,
      height: 18,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    sectionRule: { flex: 1, height: 1, borderRadius: 1 },
    change: { flexDirection: "row", gap: 8, alignItems: "flex-start", paddingLeft: 3 },
    bullet: { width: 4, height: 4, borderRadius: 2, marginTop: 7 },
    changeText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: c.text, opacity: 0.85 },
  });
}
