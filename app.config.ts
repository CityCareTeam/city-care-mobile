import { ConfigContext } from "expo/config";
import { version as releasedVersion } from "./package.json";

// ─── Version et canal de diffusion ────────────────────────────────────────────
//
// `package.json` porte la dernière version *livrée* — c'est semantic-release
// qui l'écrit, on n'y touche pas à la main. Les builds hors production sont des
// avant-premières de la version *suivante* : elles portent donc le patch
// incrémenté suivi d'une étiquette, et affichent un badge dans l'application.
//
// EAS renseigne `EAS_BUILD_PROFILE` pendant un build. En son absence on est en
// développement local, donc en beta.

const TAG_BY_PROFILE: Record<string, string> = {
  "dev-local": "beta",
  preview: "rc",
  production: "",
};

/**
 * Trois sources, de la plus explicite à la plus permissive :
 *
 *   1. `APP_RELEASE_TAG`, posé par le profil dans `eas.json` — chaîne vide en
 *      production, ce qui rend l'absence d'étiquette explicite plutôt que
 *      déduite. C'est le garde-fou : un build production ne peut pas retomber
 *      sur le défaut et sortir badgé « beta ».
 *   2. Le nom du profil, si seul `EAS_BUILD_PROFILE` est disponible.
 *   3. `beta` par défaut — on est alors en développement local, jamais en prod.
 */
function resolveReleaseTag(): string | null {
  const explicit = process.env.APP_RELEASE_TAG;
  if (explicit !== undefined) return explicit || null;

  const profile = process.env.EAS_BUILD_PROFILE;
  if (profile) return TAG_BY_PROFILE[profile] || null;

  return "beta";
}

const releaseTag = resolveReleaseTag();

/** 1.5.4 → 1.5.5 : une pré-version annonce la prochaine, pas celle déjà livrée. */
function nextPatch(semver: string): string {
  const [major, minor, patch] = semver.split(".").map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

/**
 * Repère de build, ajouté aux seules pré-versions.
 *
 * Le numéro d'une pré-version ne bouge pas d'un build à l'autre : il est
 * recalculé depuis `package.json`, que seul semantic-release met à jour, sur
 * `main`. Deux APK beta successives porteraient donc le même `1.5.5-beta` et
 * seraient indiscernables — sur une distribution interne, c'est la garantie de
 * ne plus savoir laquelle est installée.
 *
 * Horodatage UTC en `AAMMJJHHmm`, surchargeable par `APP_BUILD_LABEL` si tu
 * veux poser un repère parlant (`APP_BUILD_LABEL=fix-clusters`).
 *
 * L'année ouvre la chaîne pour deux raisons : semver interdit le zéro initial
 * sur un identifiant numérique de pré-version — `1.5.5-beta.08142023` est
 * invalide — et il rend l'ordre correct, chaque build étant strictement
 * supérieur au précédent.
 */
function buildLabel(): string {
  const explicit = process.env.APP_BUILD_LABEL;
  if (explicit) return explicit;

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    String(now.getUTCFullYear()).slice(2),
    pad(now.getUTCMonth() + 1),
    pad(now.getUTCDate()),
    pad(now.getUTCHours()),
    pad(now.getUTCMinutes()),
  ].join("");
}

const version = releaseTag
  ? `${nextPatch(releasedVersion)}-${releaseTag}.${buildLabel()}`
  : releasedVersion;

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
        apiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
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
