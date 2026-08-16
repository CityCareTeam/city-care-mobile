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

const message = execFileSync("git", ["log", "-1", "--pretty=%s"], { encoding: "utf8" }).trim();

console.log(`Publication sur « ${channel} » (profil ${profile}) — ${message}`);
console.log(`API : ${env.EXPO_PUBLIC_API_URL}`);

execFileSync("npx", ["eas", "update", "--branch", channel, "--message", message], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, ...env },
});
