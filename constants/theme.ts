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
export const CityCareColors = {
  primary: "#f6aa54",
  accent: "#f4e044",
  secondary: "#ebe192",
  background: "#f5f2e2",
  text: "#090908",
  white: "#fdfbf3",
  statusRed: "#e53935",
  statusOrange: "#f6aa54",
  statusGreen: "#43a047",
  inputBg: "#fdfbf3",
  inputBorder: "#e0ddd0",
  // Les pastilles vivent *sur* les cartes : plus sombres que la surface, elles
  // s'y creusent au lieu d'y flotter.
  chipBg: "#efebd8",
  chipBorder: "#e0ddd0",
  loaderOverlay: "rgba(245,242,226,0.6)",
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
};

