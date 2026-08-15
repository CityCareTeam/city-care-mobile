import { CHANGELOG_OVERRIDES } from "@/constants/changelog-overrides";
import { GENERATED_CHANGELOG } from "@/constants/changelog.generated";
import type { ChangeKind, ReleaseNote } from "@/types/changelog";
import type MaterialIcons from "@expo/vector-icons/MaterialIcons";

// Ce fichier ne porte que des données. Tout ce qui les interroge — regroupement
// par palier, répartition par nature, résolution d'une version en préparation —
// vit dans `utils/changelog.ts`.

export const CHANGE_KIND: Record<
  ChangeKind,
  { label: string; color: string; icon: React.ComponentProps<typeof MaterialIcons>["name"] }
> = {
  feature: { label: "Nouveau", color: "#4caf50", icon: "auto-awesome" },
  improvement: { label: "Amélioré", color: "#2196f3", icon: "trending-up" },
  fix: { label: "Corrigé", color: "#f0a500", icon: "build" },
};

/** Versions qui portent un tag git — donc réellement livrées. */
export const RELEASED_VERSIONS = new Set(GENERATED_CHANGELOG.map((note) => note.version));

function compareVersionsDesc(a: string, b: string): number {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) return right[i] - left[i];
  }
  return 0;
}

/**
 * Journal complet : le généré depuis git, plus les surcharges par-dessus. Une
 * surcharge dont le numéro n'existe pas encore côté git ajoute une entrée —
 * c'est ainsi qu'une version en préparation apparaît.
 */
export const CHANGELOG: ReleaseNote[] = (() => {
  const byVersion = new Map<string, ReleaseNote>();

  for (const note of GENERATED_CHANGELOG) byVersion.set(note.version, note);

  for (const [version, override] of Object.entries(CHANGELOG_OVERRIDES)) {
    const base = byVersion.get(version);
    byVersion.set(version, {
      version,
      date: override.date ?? base?.date ?? "",
      changes: override.changes ?? base?.changes ?? [],
      ...(override.headline ? { headline: override.headline } : {}),
    });
  }

  return [...byVersion.values()]
    .filter((note) => note.changes.length > 0)
    .sort((a, b) => compareVersionsDesc(a.version, b.version));
})();
