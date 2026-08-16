/**
 * Mélange deux couleurs opaques.
 *
 * Écrit pour une raison précise : **sur Android, une élévation posée sur un fond
 * translucide laisse voir son ombre à travers.** Le fond `#f6aa540F` d'une
 * notification non lue laissait donc apparaître une dalle grise sous la carte —
 * le même défaut de rendu que celui déjà rencontré avec `expo-blur`, qui avait
 * donné `GlassSurface`.
 *
 * Superposer une teinte à 6 % d'opacité et calculer la couleur qui en résulte
 * donnent le même résultat à l'œil ; seule la seconde est opaque, donc sans
 * artefact. On calcule.
 */
export function mixHex(base: string, tint: string, ratio: number): string {
  const a = parseHex(base);
  const b = parseHex(tint);
  if (!a || !b) return base;

  const clamped = Math.min(Math.max(ratio, 0), 1);
  const channel = (from: number, to: number) => Math.round(from + (to - from) * clamped);

  return (
    "#" +
    [channel(a[0], b[0]), channel(a[1], b[1]), channel(a[2], b[2])]
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("")
  );
}

/** `#f6aa54` ou `#fa5` → `[246, 170, 84]`. Tout le reste rend `null`. */
function parseHex(color: string): [number, number, number] | null {
  const hex = color.trim().replace("#", "");
  const full =
    hex.length === 3
      ? hex.split("").map((character) => character + character).join("")
      : hex;

  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;

  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}
