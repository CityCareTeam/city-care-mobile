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
import { readFileSync, writeFileSync } from "node:fs";

const OUTPUT = "constants/changelog.generated.ts";
const VERSION_PLAN = "version-plan.json";
const LINE = String.fromCharCode(10);
// Séparateurs ASCII, absents de tout message de commit.
const UNIT = String.fromCharCode(31);
const RECORD = String.fromCharCode(30);

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

/**
 * Lignes conventionnelles d'un commit : son sujet, **et** les puces de son corps.
 *
 * Les pull requests sont écrasées à la fusion : `main` ne reçoit qu'un commit
 * par release, dont le sujet est le titre de la PR. Mais GitHub recopie la
 * description de la PR dans le corps, et celle-ci liste les commits d'origine
 * sous forme de puces. Ne lire que le sujet revenait à jeter tout le détail —
 * la 1.4.0 y cachait dix commits.
 */
function conventionalLines(subject, body) {
  const lines = [subject];
  for (const raw of body.split(LINE)) {
    const trimmed = raw.trim();
    const bullet = trimmed.replace(/^[*-]\s+/, "");
    if (bullet !== trimmed) lines.push(bullet);
  }
  return lines;
}

/** Parcourt un `git log` en lisant sujet et corps de chaque commit. */
function parseLog(...logArgs) {
  const raw = git("log", "--no-merges", `--pretty=format:%s${UNIT}%b${RECORD}`, ...logArgs);
  if (!raw) return [];

  const seen = new Set();
  const changes = [];

  for (const record of raw.split(RECORD)) {
    const [subject = "", body = ""] = record.split(UNIT);
    if (!subject.trim()) continue;

    for (const line of conventionalLines(subject.trim(), body)) {
      const change = parseCommit(line);
      if (!change || seen.has(change.text)) continue;
      seen.add(change.text);
      changes.push(change);
    }
  }

  return changes;
}

function changesBetween(from, to) {
  return parseLog(from ? `${from}..${to}` : to);
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
  return parseLog(`--since=${isoDate}`, "HEAD").filter(
    (change) => !alreadyReleased.has(change.text),
  );
}

const lastReleaseDate = lastTag ? git("log", "-1", "--format=%aI", lastTag) : null;
const unreleased = lastReleaseDate ? changesSince(lastReleaseDate) : [];

// ─── Prédiction du prochain numéro ───────────────────────────────────────────
//
// Une pré-version doit annoncer la version qu'elle prépare. Incrémenter le
// patch à l'aveugle était faux : un seul `feat:` fait sortir semantic-release
// en mineur, et la beta aurait annoncé une 1.5.5 qui n'existerait jamais.
//
// On applique donc les mêmes règles que le preset angular de semantic-release.
// Seuls `feat`, `fix` et `perf` déclenchent une release ; le reste ne compte pas.

const BUMP_BY_TYPE = { feat: "minor", fix: "patch", perf: "patch" };
const BUMP_RANK = { none: 0, patch: 1, minor: 2, major: 3 };

/** Le palier le plus fort l'emporte, comme chez semantic-release. */
function predictBump(isoDate) {
  if (!isoDate) return "none";

  const raw = git("log", "--no-merges", `--since=${isoDate}`, `--pretty=format:%s${UNIT}%b${RECORD}`, "HEAD");
  let bump = "none";

  for (const record of raw.split(RECORD)) {
    const [subject = "", body = ""] = record.split(UNIT);
    if (!subject.trim()) continue;

    // Une rupture peut être déclarée dans le corps plutôt que par le `!`.
    if (body.includes("BREAKING CHANGE")) return "major";

    for (const line of conventionalLines(subject.trim(), body)) {
      const match = line.match(/^(\w+)(?:\([^)]+\))?(!)?:/);
      if (!match) continue;

      const [, type, breaking] = match;
      const level = breaking ? "major" : BUMP_BY_TYPE[type];
      if (level && BUMP_RANK[level] > BUMP_RANK[bump]) bump = level;
    }
  }

  return bump;
}

function applyBump(version, bump) {
  const [major, minor, patch] = version.split(".").map(Number);
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

const lastReleased = lastTag ? lastTag.replace(/^v/, "") : "0.0.0";
const bump = predictBump(lastReleaseDate);
// Rien de publiable en attente : la prochaine sera malgré tout un patch, c'est
// le plancher que retiendra semantic-release dès qu'un `fix:` arrivera.
const nextVersion = applyBump(lastReleased, bump === "none" ? "patch" : bump);

// ─── Rang de la pré-version ──────────────────────────────────────────────────
//
// Les beta se distinguaient par un horodatage — `1.5.5-beta.2608142035` — donc
// par dix chiffres qu'on ne sait ni lire ni annoncer. On compte désormais les
// builds du cycle : beta.1, beta.2, beta.3.
//
// Le compteur vit dans `version-plan.json`, à côté de la version qu'il numérote,
// et repart de zéro dès que cette version change : une release referme le cycle,
// la suivante rouvre à beta.1. Seul `--prerelease` l'incrémente — une simple
// régénération du journal (la CI en fait une à chaque release) ne doit pas
// consommer un numéro.

function previousPlan() {
  try {
    return JSON.parse(readFileSync(VERSION_PLAN, "utf8"));
  } catch {
    return null; // Premier passage, ou fichier illisible : on repart de zéro.
  }
}

const previous = previousPlan();
const sameCycle = previous?.nextVersion === nextVersion;
const alreadyBuilt = sameCycle && Number.isInteger(previous.prerelease) ? previous.prerelease : 0;
const prerelease = alreadyBuilt + (process.argv.includes("--prerelease") ? 1 : 0);

writeFileSync(
  VERSION_PLAN,
  JSON.stringify({ lastReleased, bump, nextVersion, prerelease }, null, 2) + LINE,
  "utf8",
);

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
console.log(
  `${VERSION_PLAN} — ${lastReleased} + ${bump} → ${nextVersion}` +
  (prerelease > 0 ? ` (pré-version n° ${prerelease})` : ""),
);

// ─── `--commit` : referme la boucle avant un build ───────────────────────────
//
// Sans ça, `build:beta` régénérait le journal, salissait l'arbre, et EAS
// s'interrompait pour demander quoi en faire — au milieu d'un build qu'on venait
// de lancer. Avec, la synchronisation est faite et actée avant qu'EAS ne
// démarre, donc rien à relancer.
//
// Seuls les deux fichiers générés sont indexés : un travail en cours à côté
// n'est jamais emporté par mégarde.
if (process.argv.includes("--commit")) {
  const generated = [OUTPUT, VERSION_PLAN];
  git("add", "--", ...generated);

  const staged = git("diff", "--staged", "--name-only", "--", ...generated);
  if (staged) {
    git("commit", "-m", "chore(changelog): sync release notes");
    console.log(`${LINE}Journal synchronisé et commité.`);
  } else {
    console.log(`${LINE}Journal déjà à jour, rien à commiter.`);
  }
}

// Les pull requests sont écrasées à la fusion : seul le **titre** de la PR
// devient un commit sur `main`, et c'est donc lui seul que semantic-release
// analyse. Si son type diverge de ce que contient la branche, la release sortira
// sur un autre palier que celui annoncé par la beta. On rappelle donc le
// préfixe qui fait coïncider les deux.
if (unreleased.length > 0) {
  const PREFIX_FOR = { major: "feat!", minor: "feat", patch: "fix", none: "fix" };
  console.log(
    `${LINE}Titre de PR à utiliser pour sortir en ${nextVersion} :` +
    `${LINE}  ${PREFIX_FOR[bump]}: <résumé court>` +
    `${LINE}Le détail va dans la description, il est repris dans les notes.`,
  );
}
