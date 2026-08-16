import { existsSync } from 'node:fs';
// Chemins relatifs pour ces deux-là : ce test lit des fichiers du dépôt, pas des
// modules de l'application. L'alias `@/` est résolu par Metro et par Jest, mais
// pas par tous les outils qui ouvriront ce fichier.
import nativeRuntime from '../../constants/native-runtime.json';
import { dependencies } from '../../package.json';

/**
 * `runtimeVersion` est posée à la main depuis que la politique `fingerprint` a
 * dû être abandonnée : l'empreinte incluait la clé Google Maps, absente en local
 * et injectée par un secret pendant le build, d'où deux valeurs pour le même
 * code.
 *
 * Le prix de ce choix est l'oubli : ajouter une dépendance native sans
 * incrémenter la génération, c'est publier un bundle qui appelle un module que
 * le binaire installé ne contient pas. L'application se ferme au lancement, chez
 * tous ceux qui ont reçu la mise à jour, et il n'y a plus d'OTA pour les
 * rattraper — il faut redistribuer un APK.
 *
 * Ce test est là pour que l'oubli se voie ici, et pas sur les téléphones.
 */

/** Une dépendance apporte du natif si elle expose un dossier `android` ou se déclare module Expo. */
function isNative(name: string): boolean {
  return (
    existsSync(`node_modules/${name}/android`) ||
    existsSync(`node_modules/${name}/expo-module.config.json`)
  );
}

describe('génération native', () => {
  // EAS attend une chaîne : un nombre passerait la config mais pas la
  // publication.
  it('est une chaîne non vide', () => {
    expect(typeof nativeRuntime.version).toBe('string');
    expect(nativeRuntime.version.length).toBeGreaterThan(0);
  });

  it('recense exactement les dépendances natives installées', () => {
    const installed = Object.keys(dependencies).filter(isNative).sort();

    // Si ce test échoue, lisez la différence avant de recopier la liste : une
    // dépendance native apparue ou disparue veut dire que les APK déjà
    // distribués ne peuvent plus recevoir le nouveau bundle. Incrémentez
    // `version` dans constants/native-runtime.json, mettez `nativeModules` à
    // jour, et rebuildez avant de publier quoi que ce soit à la volée.
    expect(installed).toEqual([...nativeRuntime.nativeModules].sort());
  });
});
