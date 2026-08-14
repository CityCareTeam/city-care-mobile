#!/usr/bin/env node
/**
 * Reconstruit le journal des versions à partir des tags git et des messages de
 * commit conventionnels, puis écrit `constants/changelog.generated.ts`.
 *
 * Le journal cesse ainsi d'être recopié à la main : semantic-release pose déjà
 * un tag par version et impose le format des commits, toute l'information est
 * donc là. Ce qu'on ne peut pas deviner — une formulation destinée à
 * l'utilisateur plutôt qu'au développeur — se surcharge dans
 * `constants/changelog-overrides.ts`, qui a le dernier mot.
 *
 *   node scripts/generate-changelog.mjs
 */

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const OUTPUT = "constants/changelog.generated.ts";
const LINE = String.fromCharCode(10);

/** Types conventionnels retenus, et la nature qu'ils prennent dans l'app. */
const KIND_BY_TYPE = {
  feat: "feature",
  fix: "fix",
  perf: "improvement",
  refactor: "improvement",
  style: "improvement",
};

/** Bruit d'outillage : sans intérêt pour qui lit les notes de version. */
const IGNORED_TYPES = new Set(["chore", "docs", "ci", "test", "build", "revert"]);

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function releaseTags() {
  return git("tag", "--sort=v:refname")
    .split("\n")
    .filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag));
}

/**
 * `fix(map): render custom pins on Android (#43)` →
 * `{ kind: "fix", scope: "map", text: "Render custom pins on Android" }`
 */
function parseCommit(subject) {
  const match = subject.match(/^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)$/);
  if (!match) return null;

  const [, type, scope, rest] = match;
  if (IGNORED_TYPES.has(type)) return null;

  const kind = KIND_BY_TYPE[type];
  if (!kind) return null;

  // Numéro de pull request en fin de sujet : utile dans git, pas dans l'app.
  const text = rest.replace(/\s*\(#\d+\)\s*$/, "").trim();
  if (!text) return null;

  return {
    kind,
    ...(scope ? { scope } : {}),
    text: text.charAt(0).toUpperCase() + text.slice(1),
  };
}

function changesBetween(from, to) {
  const range = from ? `${from}..${to}` : to;
  const subjects = git("log", "--no-merges", "--pretty=format:%s", range);
  if (!subjects) return [];

  const seen = new Set();
  return subjects
    .split("\n")
    .map(parseCommit)
    .filter((change) => {
      if (!change || seen.has(change.text)) return false;
      seen.add(change.text);
      return true;
    });
}

function build() {
  const tags = releaseTags();
  const notes = [];

  tags.forEach((tag, index) => {
    const changes = changesBetween(tags[index - 1], tag);
    // Une version sans rien à raconter n'a pas de bloc : elle ne contenait que
    // de l'outillage.
    if (changes.length === 0) return;

    notes.push({
      version: tag.replace(/^v/, ""),
      date: git("log", "-1", "--format=%aI", tag).slice(0, 10),
      changes,
    });
  });

  return notes.reverse(); // De la plus récente à la plus ancienne
}

const notes = build();

// Commits postérieurs au dernier tag : ce que contient une beta et qu'aucune
// version publiée ne décrit encore. Sans ça, un build de pré-version affichait
// un journal muet sur ce qu'il apportait justement.
const tags = releaseTags();
const lastTag = tags[tags.length - 1] ?? null;

// Bornage par date, et non par plage de révisions : `dev` est une branche
// longue dont l'historique diverge de `main`, et les pull requests sont
// écrasées à la fusion. Un `tag..HEAD` y ferait donc remonter des dizaines de
// commits déjà publiés sous un autre SHA. Ce qui suit la date de la dernière
// release, en revanche, est bien ce qui n'est pas encore sorti.
//
// Le dédoublonnage par libellé rattrape le reste : un même travail écrasé des
// deux côtés garde son texte.
const alreadyReleased = new Set(
  notes.flatMap((note) => note.changes.map((change) => change.text)),
);

function changesSince(isoDate) {
  const subjects = git("log", "--no-merges", `--since=${isoDate}`, "--pretty=format:%s", "HEAD");
  if (!subjects) return [];
  const seen = new Set();
  return subjects
    .split(LINE)
    .map(parseCommit)
    .filter((change) => {
      if (!change || seen.has(change.text) || alreadyReleased.has(change.text)) return false;
      seen.add(change.text);
      return true;
    });
}

const unreleased = lastTag
  ? changesSince(git("log", "-1", "--format=%aI", lastTag))
  : [];

const file = `// Généré par \`npm run changelog\` — ne pas modifier à la main.
// Pour reformuler une version à destination des utilisateurs, passez par
// \`constants/changelog-overrides.ts\`.

import type { Change, ReleaseNote } from "@/types/changelog";

export const GENERATED_CHANGELOG: ReleaseNote[] = ${JSON.stringify(notes, null, 2)};

/** Dernière version publiée au moment de la génération. */
export const LAST_RELEASED_VERSION = ${JSON.stringify(lastTag ? lastTag.replace(/^v/, "") : null)};

/** Changements accumulés depuis, donc embarqués par les pré-versions. */
export const UNRELEASED_CHANGES: Change[] = ${JSON.stringify(unreleased, null, 2)};
`;

writeFileSync(OUTPUT, file, "utf8");
console.log(
  `${OUTPUT} — ${notes.length} versions, ${notes.reduce((n, r) => n + r.changes.length, 0)} changements` +
  `, ${unreleased.length} en attente depuis ${lastTag ?? "l'origine"}.`,
);
