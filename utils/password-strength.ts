export type StrengthLevel = { score: 0 | 1 | 2 | 3; label: string; color: string };

export function getStrength(pwd: string): StrengthLevel {
  if (!pwd) return { score: 0, label: "", color: "transparent" };
  const has = {
    lower:  /[a-z]/.test(pwd),
    upper:  /[A-Z]/.test(pwd),
    digit:  /\d/.test(pwd),
    symbol: /[^a-zA-Z0-9]/.test(pwd),
  };
  const types = Object.values(has).filter(Boolean).length;
  if (pwd.length < 6)               return { score: 1, label: "Faible", color: "#e53e3e" };
  if (pwd.length < 10 || types < 3) return { score: 2, label: "Moyen",  color: "#f0a500" };
  return                                   { score: 3, label: "Fort",   color: "#4caf50" };
}
