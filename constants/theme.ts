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

