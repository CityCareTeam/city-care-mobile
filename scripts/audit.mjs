#!/usr/bin/env node
/**
 * Audit de sécurité avec liste d'exceptions.
 *
 * `npm audit --audit-level=high` remonte des vulnérabilités que ce projet ne
 * peut pas corriger : elles vivent dans l'outillage de build du SDK Expo
 * (`tar`, `undici`, `postcss`…), sous `expo`, `react-native` et
 * `react-native-reanimated`. Les remonter casserait l'alignement du SDK, et
 * aucune n'est embarquée dans l'APK livré.
 *
 * Un garde-fou qui ne peut jamais passer finit ignoré. Celui-ci échoue donc
 * uniquement sur les advisories **absentes de `.audit-allowlist.json`** — donc
 * sur une nouveauté, ou sur une dépendance qu'on vient d'ajouter. Chaque
 * exception y porte son motif et sa date : on accepte un risque, on ne
 * l'ignore pas.
 *
 *   node scripts/audit.mjs
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const ALLOWLIST = ".audit-allowlist.json";
const BLOCKING = new Set(["high", "critical"]);

/** `npm audit` sort en code 1 dès qu'il trouve quelque chose : on lit quand même. */
function runAudit() {
  try {
    return execFileSync("npm", ["audit", "--json"], {
      encoding: "utf8",
      shell: process.platform === "win32",
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (error) {
    if (error.stdout) return error.stdout;
    throw error;
  }
}

/** Une advisory peut remonter par plusieurs chemins : on déduplique sur le GHSA. */
function collectAdvisories(report) {
  const found = new Map();
  for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
    for (const via of vulnerability.via) {
      if (typeof via !== "object" || !BLOCKING.has(via.severity)) continue;
      const id = String(via.url ?? "").split("/").pop();
      if (id) found.set(id, { package: via.name, severity: via.severity, title: via.title, url: via.url });
    }
  }
  return found;
}

const report = JSON.parse(runAudit());
const found = collectAdvisories(report);
const allowed = JSON.parse(readFileSync(ALLOWLIST, "utf8"));

const unreviewed = [...found].filter(([id]) => !(id in allowed));
// Une exception qui ne remonte plus a été corrigée en amont : la retirer, sinon
// la liste enfle et finit par couvrir des choses qu'on n'a jamais relues.
const stale = Object.keys(allowed).filter((id) => !found.has(id));

if (stale.length > 0) {
  console.log(`${stale.length} exception(s) obsolète(s) à retirer de ${ALLOWLIST} :`);
  for (const id of stale) console.log(`  ${id}  (${allowed[id].package})`);
  console.log("");
}

if (unreviewed.length > 0) {
  console.error(`${unreviewed.length} advisory(s) non examinée(s) :\n`);
  for (const [id, advisory] of unreviewed) {
    console.error(`  ${advisory.severity.toUpperCase().padEnd(9)} ${advisory.package}`);
    console.error(`  ${advisory.title}`);
    console.error(`  ${id} — ${advisory.url}\n`);
  }
  console.error(
    `Corrigez-les, ou inscrivez-les dans ${ALLOWLIST} avec un motif et une date\n` +
    `si le risque est accepté en connaissance de cause.`,
  );
  process.exit(1);
}

console.log(
  `Audit : ${found.size} advisory(s) high/critical, toutes examinées et acceptées. ` +
  `0 nouvelle.`,
);
