export default {
  expo: {
    name: "FastRevEd Kids",
    slug: "fastreved-kids",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#6366f1"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.diamondapp.fastrevedkids",
      infoPlist: {
        NSMicrophoneUsageDescription: "L'application a besoin d'accéder au microphone pour les exercices de prononciation."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#6366f1"
      },
      package: "com.diamondapp.fastrevedkids",
      permissions: [
        "android.permission.INTERNET",
        "android.permission.RECORD_AUDIO"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-av",
        {
          microphonePermission: "L'application a besoin d'accéder au microphone pour les exercices de prononciation."
        }
      ]
    ]
  }
};
