import { CHANGELOG, RELEASED_VERSIONS } from "@/constants/changelog";
import { UNRELEASED_CHANGES } from "@/constants/changelog.generated";
import { minorOf } from "@/utils/app-version";
import type { Change, ChangeKind, ReleaseGroup, ReleaseNote } from "@/types/changelog";

/** Ordre de lecture des natures : le nouveau d'abord, le correctif en dernier. */
export const KIND_ORDER: ChangeKind[] = ["feature", "improvement", "fix"];

/** Une version publiée porte un tag git. */
export function isReleased(version: string): boolean {
  return RELEASED_VERSIONS.has(version);
}

/**
 * Journal tel que le voit une version donnée.
 *
 * Une pré-version embarque des changements qu'aucun tag ne décrit encore : le
 * générateur les collecte depuis la dernière release, et on les rattache ici au
 * numéro que la pré-version revendique. Une surcharge portant ce numéro
 * l'emporte, ce qui permet de reformuler la version en préparation.
 *
 * Sans ça, une beta affichait un journal muet sur ce qu'elle apportait —
 * le seul moment où la question se pose vraiment.
 */
export function changelogFor(version: string): ReleaseNote[] {
  if (isReleased(version) || CHANGELOG.some((note) => note.version === version)) {
    return CHANGELOG;
  }
  if (UNRELEASED_CHANGES.length === 0) return CHANGELOG;

  const pending: ReleaseNote = {
    version,
    date: new Date().toISOString().slice(0, 10),
    changes: UNRELEASED_CHANGES,
  };
  return [pending, ...CHANGELOG];
}

/**
 * Répartit les changements d'une version par nature, dans l'ordre de lecture.
 * Les sections vides sont écartées.
 */
export function changesByKind(note: ReleaseNote): { kind: ChangeKind; changes: Change[] }[] {
  return KIND_ORDER.map((kind) => ({
    kind,
    changes: note.changes.filter((change) => change.kind === kind),
  })).filter((section) => section.changes.length > 0);
}

/** Compte par nature sur tout un palier, pour le résumer sans le déplier. */
export function countsByKind(group: ReleaseGroup): { kind: ChangeKind; count: number }[] {
  const totals = new Map<ChangeKind, number>();
  for (const note of group.releases) {
    for (const change of note.changes) {
      totals.set(change.kind, (totals.get(change.kind) ?? 0) + 1);
    }
  }
  return KIND_ORDER.filter((kind) => totals.has(kind)).map((kind) => ({
    kind,
    count: totals.get(kind)!,
  }));
}

/**
 * Regroupe par palier mineur — `1.5`, `1.4`, `1.3` — chacun contenant ses
 * correctifs. Vingt-huit versions à plat sont illisibles ; regroupées, on voit
 * les grandes étapes et on déplie celle qui intéresse.
 */
export function groupByMinor(notes: ReleaseNote[] = CHANGELOG): ReleaseGroup[] {
  const groups = new Map<string, ReleaseNote[]>();

  for (const note of notes) {
    const minor = minorOf(note.version);
    const bucket = groups.get(minor);
    if (bucket) bucket.push(note);
    else groups.set(minor, [note]);
  }

  return [...groups.entries()].map(([minor, releases]) => ({
    minor,
    releases,
    latestDate: releases[0]?.date ?? "",
    changeCount: releases.reduce((total, note) => total + note.changes.length, 0),
  }));
}
