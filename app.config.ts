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
  },
  android: {
    package: "com.citycare.mobile",
    adaptiveIcon: {
      backgroundColor: "#f6aa54",
      foregroundImage: "./assets/images/logo-city-care.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
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
        image: "./assets/images/fond-splash.png",
        imageWidth: 1284,
        resizeMode: "cover",
        backgroundColor: "#f6aa54",
        dark: {
          image: "./assets/images/fond-splash.png",
          backgroundColor: "#f6aa54",
        },
      },
    ],
    "expo-secure-store",
    [
      "expo-location",
      {
        locationWhenInUsePermission: "Autoriser $(PRODUCT_NAME) à utiliser votre localisation",
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
