export default {
  expo: {
    name: "Revi",
    slug: "revi-vault",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      config: {
        usesNonExemptEncryption: false,
      },
      associatedDomains: ["webcredentials:revibase.com"],
      supportsTablet: true,
      bundleIdentifier: "com.revibase.revi",
      newArchEnabled: true,
      googleServicesFile:
        process.env.GOOGLE_SERVICES_INFO_PLIST ||
        "./assets/google/GoogleService-Info.plist",
      infoPlist: {
        NSFaceIDUsageDescription:
          "Authenticate to securely access your wallet.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      permissions: ["android.permission.NFC"],
      package: "com.revibase.revi",
      newArchEnabled: true,
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ||
        "./assets/google/google-services.json",
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
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
      "@react-native-firebase/crashlytics",
      "@react-native-firebase/app-check",
      "@react-native-firebase/app",
      [
        "expo-build-properties",
        {
          newArchEnabled: true,
          android: {
            compileSdkVersion: 35,
          },
          ios: {
            useFrameworks: "static",
            deploymentTarget: "15.1",
          },
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/notification-icon.png",
          color: "#000000",
          defaultChannel: "default",
          enableBackgroundRemoteNotifications: false,
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
        projectId: "e7fd109a-36ed-4ec0-ac7e-6c6c1a0ffb87",
      },
    },
    owner: "revibase",
  },
};
