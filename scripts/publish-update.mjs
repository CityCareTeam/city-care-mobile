#!/usr/bin/env node
/**
 * Publication d'une mise à jour à la volée (OTA).
 *
 *   node scripts/publish-update.mjs beta
 *
 * `eas update` exige un message, et refuse de le demander en non-interactif.
 * Le sujet du dernier commit est le seul libellé qui ait une chance d'être
 * juste : c'est exactement ce qu'on vient de corriger. Le taper une seconde
 * fois à la main, c'est se donner l'occasion d'écrire autre chose.
 *
 * Le script existe surtout parce que `$(git log -1 …)` dans un script npm ne
 * survit pas à Windows, où npm passe par `cmd.exe`.
 *
 * ⚠️ Les `EXPO_PUBLIC_*` sont inlinés dans le bundle au moment de la
 * publication, pas à celui du build : publier depuis un shell dont
 * `EXPO_PUBLIC_API_URL` ne correspond pas au canal visé enverrait les appareils
 * sur le mauvais back. D'où la lecture explicite du profil correspondant dans
 * `eas.json`, et l'arrêt net s'il n'existe pas.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const CHANNEL_PROFILE = {
  beta: "dev-local",
  rc: "preview",
  production: "production",
};

const channel = process.argv[2];
const profile = CHANNEL_PROFILE[channel];

if (!profile) {
  console.error(
    `Canal inconnu : « ${channel ?? "" } ». Attendu : ${Object.keys(CHANNEL_PROFILE).join(", ")}.`,
  );
  process.exit(1);
}

const { build } = JSON.parse(readFileSync("eas.json", "utf8"));
const env = build[profile]?.env;

if (!env?.EXPO_PUBLIC_API_URL) {
  console.error(`Le profil « ${profile} » n'expose pas EXPO_PUBLIC_API_URL dans eas.json.`);
  process.exit(1);
}

/**
 * Windows n'a pas d'exécutable `npx` : c'est un `.cmd`, que Node ne sait lancer
 * qu'à travers `cmd.exe`. Or avec `shell: true`, Node recolle les arguments en
 * une seule ligne de commande **sans les protéger** — et un message de commit
 * comme « fix(release): refresh the changelog » y explose en huit arguments,
 * parenthèses comprises, que le shell interprète.
 *
 * On protège donc soi-même, et seulement quand un shell est dans la boucle :
 * ailleurs, le tableau d'arguments est transmis tel quel au processus.
 */
const USE_SHELL = process.platform === "win32";

function shellArgs(args) {
  if (!USE_SHELL) return args;
  return args.map((arg) => `"${String(arg).replace(/"/g, '""')}"`);
}

function run(command, args, options = {}) {
  return execFileSync(command, shellArgs(args), { shell: USE_SHELL, ...options });
}

/**
 * Le sujet du dernier commit — en sautant les synchronisations du journal, qui
 * ne décrivent rien : la ligne suivante est lue avant que ce script n'en
 * produise une de plus.
 */
function lastMeaningfulSubject() {
  const subjects = execFileSync("git", ["log", "-10", "--pretty=%s"], { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return subjects.find((subject) => !subject.startsWith("chore(changelog)")) ?? "mise à jour";
}

const message = lastMeaningfulSubject();

// Les notes de version sont du JavaScript généré : elles partent dans le bundle,
// donc elles doivent décrire ce bundle. Sans cette régénération, une mise à jour
// à la volée livrait le code du jour et les notes du dernier build — l'écran
// « Nouveautés » taisait précisément ce qu'on venait d'envoyer.
//
// `--commit` sans `--prerelease` : le journal est rafraîchi et acté, mais le
// rang de pré-version ne bouge pas. Il compte les APK ; une mise à jour à la
// volée n'en produit aucun, et se distingue par l'identifiant de bundle affiché
// dans la pastille de version.
// En intégration continue, le journal vient d'être régénéré et poussé par le
// job de release : le refaire ici produirait un commit de plus, sur une copie
// détachée, qui ne remonterait nulle part.
if (process.argv.includes("--skip-changelog")) {
  console.log("Journal laissé tel quel (--skip-changelog).");
} else {
  console.log("Régénération du journal des versions…");
  run("node", ["scripts/generate-changelog.mjs", "--commit"], { stdio: "inherit" });
}

console.log(`Publication sur « ${channel} » (profil ${profile}) — ${message}`);
console.log(`API : ${env.EXPO_PUBLIC_API_URL}`);

run("npx", ["eas", "update", "--branch", channel, "--message", message], {
  stdio: "inherit",
  env: { ...process.env, ...env },
});
