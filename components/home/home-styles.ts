import { CityCareColors, CityCareColorsDark } from "@/constants/theme";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { StyleSheet } from "react-native";

/**
 * Les styles de l accueil, partages par l ecran et par tout ce qu il affiche.
 *
 * Construits une fois par theme au chargement du module, et non a chaque rendu :
 * l ecran se redessine a chaque sondage du fil, et refabriquer deux cents regles
 * a ce rythme serait absurde. Les composants choisissent le jeu, ils ne le
 * calculent pas.
 */
function makeStyles(c: AppColors) {
  return StyleSheet.create({
    centered: {
      flex: 1,
      backgroundColor: c.background,
      justifyContent: "center",
      alignItems: "center",
    },
    scroll: { flex: 1, backgroundColor: c.background },
    content: { padding: 20, paddingBottom: 40 },
    // Information, pas alerte : ces signalements ne sont pas perdus, ils
    // attendent. Le ton reste celui de la marque, pas celui d'une erreur.
    pendingNotice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      borderRadius: 14,
      marginBottom: 16,
      backgroundColor: c.primary + "14",
      borderWidth: 1,
      borderColor: c.primary + "33",
    },
    pendingText: { flex: 1, fontSize: 12, color: c.text, opacity: 0.75 },
    headerCard: {
      backgroundColor: c.primary,
      borderRadius: 20,
      padding: 22,
      marginBottom: 20,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    },
    utilityRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
    headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    identity: { flex: 1, gap: 7 },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    // La météo reprend la pastille de l'horloge : les deux encadrent le bloc et
    // se lisent comme des données, pas comme des phrases.
    weatherChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      alignSelf: "flex-start",
      marginTop: 14,
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.16)",
    },
    weatherTemp: {
      fontSize: 14,
      fontWeight: "800",
      color: "#fff",
      fontVariant: ["tabular-nums"],
    },
    weatherLabel: { fontSize: 12.5, color: "rgba(255,255,255,0.8)", flexShrink: 1 },
    menuBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.18)",
    },
    menuDot: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#fff",
      borderWidth: 1.5,
      borderColor: c.primary,
    },
    greeting: { fontSize: 25, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
    headerDate: { fontSize: 13, color: "rgba(255,255,255,0.6)" },
    // Le rôle rejoint la date sur la même ligne : posé seul, il ouvrait un
    // quatrième étage dans un bloc qui en comptait déjà trois.
    rolePill: {
      backgroundColor: "rgba(255,255,255,0.22)",
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    rolePillText: { fontSize: 11, fontWeight: "700", color: "#fff" },
    // Pied du bilan de l'agent : détaché de la légende par un filet, parce
    // qu'il ne décrit pas la même chose — la légende ventile, cette ligne
    // désigne le travail.
    backlogRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: c.chipBorder,
    },
    backlogText: { fontSize: 13, fontWeight: "700", color: c.text, opacity: 0.75 },
    reportShortcut: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "rgba(255,255,255,0.18)",
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginTop: 12,
    },
    reportShortcutText: { fontSize: 14, fontWeight: "600", color: "#fff", flex: 1 },
    draftPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 9,
      backgroundColor: "rgba(255,255,255,0.9)",
    },
    draftPillText: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.3,
      color: c.primary,
      textTransform: "uppercase",
    },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sectionAccent: {
      width: 3,
      height: 18,
      borderRadius: 2,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: c.text,
    },
    tabBar: {
      flexDirection: "row",
      borderRadius: 14,
      backgroundColor: c.secondary,
      padding: 3,
      marginBottom: 16,
    },
    tab: {
      flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
      paddingVertical: 10, borderRadius: 11, gap: 6,
    },
    tabActive: { backgroundColor: c.white },
    tabText: { fontSize: 13, fontWeight: "600", color: c.text, opacity: 0.4 },
    tabTextActive: { opacity: 1 },
    tabBadge: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, minWidth: 22, alignItems: "center" },
    tabBadgeText: { fontSize: 11, fontWeight: "700" },
    typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
    followedHint: {
      fontSize: 12.5,
      color: c.text,
      opacity: 0.5,
      textAlign: "center",
      marginBottom: 12,
      paddingHorizontal: 20,
    },
    typeChip: {
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: c.white,
      borderWidth: 1,
      borderColor: c.chipBorder,
    },
    typeChipActive: { backgroundColor: c.primary, borderColor: c.primary },
    typeChipActiveText: { color: "#fff" },
    typeChipCount: { fontSize: 14, fontWeight: "800", color: c.primary },
    typeChipLabel: { fontSize: 13, color: c.text, fontWeight: "500" },
    incCard: {
      backgroundColor: c.white,
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 6,
      elevation: 3,
    },
    incDivider: { height: 1, backgroundColor: c.background, marginHorizontal: 0 },
    empty: {
      backgroundColor: c.white,
      borderRadius: 12,
      padding: 28,
      alignItems: "center",
      gap: 10,
      marginBottom: 20,
    },
    emptyIconWrap: {
      width: 52, height: 52, borderRadius: 16,
      alignItems: "center", justifyContent: "center",
    },
    emptyText: { fontSize: 14, color: c.text, opacity: 0.5, textAlign: "center" },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
      marginTop: 10,
    },
    countBadge: {
      borderRadius: 10,
      paddingHorizontal: 9,
      paddingVertical: 3,
    },
    countBadgeText: { fontSize: 12, fontWeight: "700" },
    showMore: { paddingVertical: 14, paddingHorizontal: 14, alignItems: "center" },
    showMoreText: { fontSize: 13, fontWeight: "700", color: c.primary },
  });
}

const lightStyles = makeStyles(CityCareColors);
const darkStyles = makeStyles(CityCareColorsDark);

/** Le jeu correspondant au theme actif. */
export function useHomeStyles(): HomeStyles {
  const { isDark } = useAppColors();
  return isDark ? darkStyles : lightStyles;
}

export type HomeStyles = ReturnType<typeof makeStyles>;
