// CityCare+ charte graphique — mode clair
//
// `white` est un nom de rôle, pas une couleur : c'est la surface qui se pose
// *sur* le fond — les cartes, les champs, les fenêtres. Le mode sombre le montre
// bien, il y vaut `#252520`.
//
// En clair, cette surface était un blanc pur sur un fond crème. Le contraste
// entre les deux était le plus dur de toute l'interface, et les cartes couvrent
// l'essentiel de l'écran : c'est ce blanc qu'on prenait en pleine figure. Fond et
// surface ont donc été descendus ensemble, en gardant l'écart qui fait qu'une
// carte se détache — sans lui, tout s'aplatit.
//
// Deux passes ont été nécessaires : la première, prudente, restait un blanc à
// peine tiédi. La règle qui s'en dégage est que la surface doit se lire comme un
// beige clair, pas comme un blanc qui aurait chaud — d'où une douzaine de points
// d'écart avec le fond, et pas davantage.
export const CityCareColors = {
  primary: "#f6aa54",
  accent: "#f4e044",
  secondary: "#ebe192",
  background: "#efe9d3",
  text: "#090908",
  white: "#f9f4e4",
  statusRed: "#e53935",
  statusOrange: "#f6aa54",
  statusGreen: "#43a047",
  inputBg: "#f9f4e4",
  inputBorder: "#ddd6bd",
  // Les pastilles vivent *sur* les cartes : plus sombres que la surface, elles
  // s'y creusent au lieu d'y flotter.
  chipBg: "#e8e1c7",
  chipBorder: "#ddd6bd",
  loaderOverlay: "rgba(239,233,211,0.6)",

  // ── Rouge d'alerte ──
  //
  // Distinct de `statusRed`, qui décrit un statut de signalement. Celui-ci dit
  // « attention, ceci détruit » : suppression, désactivation, masquage.
  // Vingt-trois composants l'écrivaient en dur, à deux points de `statusRed` —
  // deux rouges qu'on ne distingue pas à l'œil et que rien ne tenait ensemble.
  danger: "#e53e3e",

  // Le trio des statuts de signalement. Il vivait jusqu'ici dans
  // `constants/incidents.ts`, en trois valeurs écrites à la main qui ne
  // correspondaient à aucun jeton — dont un troisième vert, à sept points de
  // `statusGreen`, que sept composants recopiaient.
  info: "#2196f3",
  warning: "#f0a500",
  success: "#4caf50",

  // ── Rôles ──
  //
  // Une teinte par rôle, déclarée ici et nulle part ailleurs. Le violet évite à
  // l'administrateur de porter le rouge du danger : deux sens dans une même
  // couleur, c'est un sens de perdu.
  roleCitizen: "#78909C",
  roleAgent: "#1D9BF0",
  roleAdmin: "#AF52DE",
};

// CityCare+ charte graphique — mode sombre
export const CityCareColorsDark: typeof CityCareColors = {
  primary: "#f6aa54",
  accent: "#f4e044",
  secondary: "#3d3b2f",
  background: "#1a1a16",
  text: "#f0ede0",
  white: "#252520",
  statusRed: "#e53935",
  statusOrange: "#f6aa54",
  statusGreen: "#43a047",
  inputBg: "#2a2a25",
  inputBorder: "#4a4840",
  chipBg: "#2a2a25",
  chipBorder: "#4a4840",
  loaderOverlay: "rgba(26,26,22,0.6)",

  // ── Rouge d'alerte ──
  //
  // Distinct de `statusRed`, qui décrit un statut de signalement. Celui-ci dit
  // « attention, ceci détruit » : suppression, désactivation, masquage.
  // Vingt-trois composants l'écrivaient en dur, à deux points de `statusRed` —
  // deux rouges qu'on ne distingue pas à l'œil et que rien ne tenait ensemble.
  danger: "#e53e3e",

  // Le trio des statuts de signalement. Il vivait jusqu'ici dans
  // `constants/incidents.ts`, en trois valeurs écrites à la main qui ne
  // correspondaient à aucun jeton — dont un troisième vert, à sept points de
  // `statusGreen`, que sept composants recopiaient.
  info: "#2196f3",
  warning: "#f0a500",
  success: "#4caf50",

  // ── Rôles ──
  //
  // Une teinte par rôle, déclarée ici et nulle part ailleurs. Le violet évite à
  // l'administrateur de porter le rouge du danger : deux sens dans une même
  // couleur, c'est un sens de perdu.
  roleCitizen: "#78909C",
  roleAgent: "#1D9BF0",
  roleAdmin: "#AF52DE",
};


/**
 * Les teintes qui ne dépendent pas du thème, exportées pour être utilisables
 * partout — y compris à la racine d'un module, où aucun crochet ne tourne.
 *
 * Vingt-trois fichiers écrivaient ce rouge en dur, à deux points de
 * `statusRed` : deux rouges qu'on ne distingue pas à l'œil et que rien ne
 * tenait ensemble.
 */
export const DANGER = CityCareColors.danger;

/** Une teinte par rôle, déclarée ici et nulle part ailleurs. */
export const ROLE_COLOR = {
  citizen: CityCareColors.roleCitizen,
  agent: CityCareColors.roleAgent,
  admin: CityCareColors.roleAdmin,
} as const;

/** L'orange de la marque, pour les portées où aucun crochet ne tourne. */
export const PRIMARY = CityCareColors.primary;

/** Le trio des statuts, même usage. */
export const INFO = CityCareColors.info;
export const WARNING = CityCareColors.warning;
export const SUCCESS = CityCareColors.success;
