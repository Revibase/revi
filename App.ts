import "./polyfills";

import "expo-router/entry"; // Keep the expo-router entry intact
import "react-native-gesture-handler";

process.env.TAMAGUI_USE_NATIVE_PORTAL = "false";
globalThis.TAMAGUI_DITW = true;
