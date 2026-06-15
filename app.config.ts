import { ConfigContext } from "expo/config";
import { version } from "./package.json";

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
    eas: {
      projectId: "3a2efec0-7cf2-4e4b-8709-a785e0de8ca8",
    },
  },
});
