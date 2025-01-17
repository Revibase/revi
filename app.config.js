export default {
  expo: {
    name: "Revi",
    slug: "revi",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#000000",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      config: {
        usesNonExemptEncryption: false,
      },
      supportsTablet: true,
      bundleIdentifier: "com.jychab.revi",
      newArchEnabled: true,
      googleServicesFile: "./assets/google/GoogleService-Info.plist",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#000000",
      },
      permissions: ["android.permission.NFC", "VIBRATE"],
      package: "com.jychab.revi",
      newArchEnabled: true,
      googleServicesFile: "./assets/google/google-services.json",
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      [
        "expo-local-authentication",
        {
          faceIDPermission: "Allow $(PRODUCT_NAME) to use Face ID.",
        },
      ],
      [
        "react-native-nfc-manager",
        {
          nfcPermission: "NFC is required to sign transactions.",
          selectIdentifiers: [
            "A0000003965453000000010300000000",
            "D276000085304A434F9003",
          ],
          includeNdefEntitlement: true,
        },
      ],
      "expo-router",
      "expo-font",
      [
        "expo-build-properties",
        {
          newArchEnabled: true,
        },
      ],
      "react-native-cloud-storage",
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: "b85f5693-2371-4df9-bc89-94e4ac290d66",
      },
    },
    owner: "jychab",
  },
};
