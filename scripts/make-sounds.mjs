#!/usr/bin/env node
/**
 * Génère les sons de l'interface.
 *
 *   node scripts/make-sounds.mjs
 *
 * Deux fichiers WAV de quelques kilo-octets, écrits échantillon par échantillon
 * plutôt que téléchargés. La raison est simple : un son embarqué dans une
 * application doit avoir une provenance vérifiable et une licence claire, et
 * « trouvé sur une banque de sons » n'en est pas une. Ceux-ci sont deux sinus et
 * une enveloppe — rien à créditer, rien à négocier, et on peut les régler à
 * l'oreille en changeant trois nombres.
 *
 * WAV et non MP3, à dessein : pas d'encodeur à installer, décodage instantané,
 * et à cette durée la différence de taille est de quelques kilo-octets.
 */

import { mkdirSync, writeFileSync } from "node:fs";

const RATE = 22050;
const OUT = "assets/sounds";

/**
 * Enveloppe d'amplitude.
 *
 * L'attaque évite le claquement d'un signal qui démarre à pleine amplitude — un
 * front raide s'entend comme un défaut, pas comme un son. La décroissance
 * exponentielle donne le côté « percussif » qu'on attend d'un retour
 * d'interface, plutôt qu'un bip de réveil.
 */
function envelope(position, total) {
  const attack = Math.min(1, position / (RATE * 0.006));
  const decay = Math.exp((-4 * position) / total);
  return attack * decay;
}

function tone({ frequency, seconds, gain = 0.5 }) {
  const total = Math.round(RATE * seconds);
  const samples = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    samples[i] = Math.sin((2 * Math.PI * frequency * i) / RATE) * envelope(i, total) * gain;
  }
  return samples;
}

function concat(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const all = new Float32Array(total);
  let at = 0;
  for (const part of parts) {
    all.set(part, at);
    at += part.length;
  }
  return all;
}

/** En-tête RIFF de 44 octets, puis les échantillons en 16 bits signés. */
function wav(samples) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16); // taille du bloc fmt
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(RATE, 24);
  buffer.writeUInt32LE(RATE * 2, 28); // octets par seconde
  buffer.writeUInt16LE(2, 32); // octets par échantillon
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(samples.length * 2, 40);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  return buffer;
}

mkdirSync(OUT, { recursive: true });

// Deux notes qui montent — une quinte, l'intervalle que l'oreille lit comme un
// aboutissement. C'est le son d'un signalement envoyé.
writeFileSync(
  `${OUT}/success.wav`,
  wav(concat([tone({ frequency: 880, seconds: 0.09 }), tone({ frequency: 1318.5, seconds: 0.16 })])),
);

// Une seule note brève et discrète, pour accompagner un choix sans le célébrer.
writeFileSync(`${OUT}/tap.wav`, wav(tone({ frequency: 1100, seconds: 0.05, gain: 0.32 })));

// Deux notes qui descendent : la même grammaire que le succès, à l'envers.
writeFileSync(
  `${OUT}/warn.wav`,
  wav(concat([tone({ frequency: 660, seconds: 0.08 }), tone({ frequency: 440, seconds: 0.18 })])),
);

console.log(`Sons écrits dans ${OUT}/ : success.wav, tap.wav, warn.wav`);
