import { ConfigContext } from "expo/config";
import versionPlan from "./version-plan.json";

// ─── Version et canal de diffusion ────────────────────────────────────────────
//
// `package.json` porte la dernière version *livrée* — c'est semantic-release
// qui l'écrit, on n'y touche pas à la main. Les builds hors production sont des
// avant-premières de la version *suivante* : elles portent donc le patch
// incrémenté suivi d'une étiquette, et affichent un badge dans l'application.
//
// EAS renseigne `EAS_BUILD_PROFILE` pendant un build. En son absence on est en
// développement local, donc en beta.

/**
 * Valeur déclarant explicitement l'absence d'étiquette. EAS refuse une chaîne
 * vide dans `env` — d'où une sentinelle plutôt qu'une clé absente : on veut que
 * production *déclare* n'avoir aucun canal, pas qu'on le déduise d'un silence.
 */
const NO_TAG = "none";

const TAG_BY_PROFILE: Record<string, string> = {
  "dev-local": "beta",
  preview: "rc",
  production: NO_TAG,
};

/**
 * Trois sources, de la plus explicite à la plus permissive :
 *
 *   1. `APP_RELEASE_TAG`, posé par le profil dans `eas.json` — `none` en
 *      production. C'est le garde-fou : un build production ne peut pas
 *      retomber sur le défaut et sortir badgé « beta ».
 *   2. Le nom du profil, si seul `EAS_BUILD_PROFILE` est disponible.
 *   3. `beta` par défaut — on est alors en développement local, jamais en prod.
 */
function resolveReleaseTag(): string | null {
  const explicit = process.env.APP_RELEASE_TAG;
  if (explicit !== undefined) return explicit && explicit !== NO_TAG ? explicit : null;

  const profile = process.env.EAS_BUILD_PROFILE;
  if (profile) {
    const tag = TAG_BY_PROFILE[profile];
    return tag && tag !== NO_TAG ? tag : null;
  }

  return "beta";
}

const releaseTag = resolveReleaseTag();

// ─── Clé Google Maps ─────────────────────────────────────────────────────────
//
// Elle est fournie par un secret EAS, rattaché aux environnements dans lesquels
// les profils de build résolvent. Une clé absente ne se voyait pas au build :
// l'APK se construisait, s'installait, et l'application se fermait net à
// l'ouverture de la carte — `MapView` natif refuse de s'instancier sans clé.
//
//   IllegalStateException: API key not found.
//     at com.rnmaps.maps.MapView.<init>
//
// Un build EAS s'arrête donc désormais avec la raison, plutôt que de produire
// un binaire cassé. En local on reste tolérant : `expo start` doit démarrer même
// sans clé, la carte étant le seul écran concerné.

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY ?? "";

if (!googleMapsApiKey && process.env.EAS_BUILD) {
  throw new Error(
    "GOOGLE_MAPS_API_KEY est absente : la carte planterait au lancement.\n" +
    `Profil « ${process.env.EAS_BUILD_PROFILE ?? "inconnu"} ». Rattachez le secret ` +
    "à l'environnement dans lequel ce profil résout (eas env:list <environnement>).",
  );
}

/**
 * Rang de la pré-version, ajouté aux seuls builds hors production.
 *
 * Le numéro d'une pré-version ne bouge pas d'un build à l'autre : il est
 * recalculé depuis le dernier tag, que seul semantic-release pose, sur `main`.
 * Deux APK beta successives porteraient donc le même `1.5.6-beta` et seraient
 * indiscernables — sur une distribution interne, c'est la garantie de ne plus
 * savoir laquelle est installée.
 *
 * D'où un compteur : `1.5.6-beta.1`, puis `.2`, `.3`. Il est tenu dans
 * `version-plan.json` par `npm run changelog --prerelease`, qu'appelle
 * `npm run build:beta` juste avant de lancer EAS ; il repart à 1 dès que la
 * version visée change. Un horodatage tenait le même rôle, mais
 * `1.5.5-beta.2608142035` ne se lit ni ne s'annonce.
 *
 * `APP_BUILD_LABEL` reste prioritaire pour poser un repère parlant sur un build
 * ponctuel (`APP_BUILD_LABEL=fix-clusters`), hors de toute numérotation.
 */
function buildLabel(): string {
  return process.env.APP_BUILD_LABEL || String(versionPlan.prerelease ?? 0);
}

// `version-plan.json` est produit par `npm run changelog`, qui applique les
// mêmes règles que semantic-release sur les commits en attente : un `feat:`
// donne un mineur, une rupture un majeur, le reste un patch. Deviner un
// `patch + 1` faisait annoncer une 1.5.5 là où la release serait sortie en
// 1.6.0.
const version = releaseTag
  ? `${versionPlan.nextVersion}-${releaseTag}.${buildLabel()}`
  : versionPlan.lastReleased;

export default ({ config }: ConfigContext) => ({
  ...config,
  name: "City Care +",
  slug: "city-care-mobile",
  owner: "citycare",
  version,
  orientation: "portrait",
  icon: "./assets/images/logo-city-care.png",
  scheme: "citycaremobile",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  // ─── Mises à jour à la volée ───────────────────────────────────────────────
  //
  // Le bundle JS se remplace sans repasser par un APK. `fallbackToCacheTimeout`
  // à 0 : on ne bloque jamais le démarrage à attendre le réseau. La mise à jour
  // se télécharge en fond et s'applique au lancement suivant — ou tout de suite
  // si l'utilisateur accepte la bannière (`hooks/use-app-update.ts`).
  //
  // Le code natif, lui, ne bouge pas : toute nouvelle dépendance native exige
  // toujours un build EAS complet.
  updates: {
    url: "https://u.expo.dev/3a2efec0-7cf2-4e4b-8709-a785e0de8ca8",
    fallbackToCacheTimeout: 0,
  },
  // `fingerprint`, surtout pas `appVersion` : semantic-release incrémente la
  // version à chaque release, et une politique adossée à la version rendrait
  // chaque APK incompatible avec ses propres mises à jour dès le patch suivant.
  // L'empreinte ne bouge que si le natif bouge — exactement la frontière que
  // l'OTA sait franchir ou non.
  runtimeVersion: {
    policy: "fingerprint",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.citycare.mobile",
  },
  android: {
    package: "com.citycare.mobile",
    googleServicesFile: "./google-services.json",
    adaptiveIcon: {
      backgroundColor: "#f6aa54",
      foregroundImage: "./assets/images/logo-city-care.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    softwareKeyboardLayoutMode: "pan",
    predictiveBackGestureEnabled: false,
    usesCleartextTraffic: true,
    config: {
      googleMaps: {
        apiKey: googleMapsApiKey,
      },
    },
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "./plugins/withNetworkSecurityConfig",
    "expo-router",
    "expo-font",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/logo-city-care.png",
        imageWidth: 180,
        resizeMode: "contain",
        backgroundColor: "#f6aa54",
        dark: {
          image: "./assets/images/logo-city-care.png",
          backgroundColor: "#f6aa54",
        },
      },
    ],
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: "./assets/images/logo-city-care.png",
        color: "#f6aa54",
        androidMode: "default",
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission: "Autoriser $(PRODUCT_NAME) à utiliser votre localisation",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "Autoriser $(PRODUCT_NAME) à accéder à vos photos pour joindre des images à vos signalements.",
        cameraPermission: "Autoriser $(PRODUCT_NAME) à utiliser l'appareil photo pour photographier un incident.",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    // Lu par l'application pour afficher le badge de canal. La clé est
    // absente en production plutôt que mise à `null` : la sérialisation de la
    // config transforme `null` en objet vide, qui est truthy — le badge se
    // serait affiché en production.
    ...(releaseTag ? { releaseTag } : {}),
    eas: {
      projectId: "3a2efec0-7cf2-4e4b-8709-a785e0de8ca8",
    },
  },
});
