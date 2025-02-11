import "./polyfills";

import "expo-router/entry"; // Keep the expo-router entry intact

process.env.TAMAGUI_USE_NATIVE_PORTAL = "false";
globalThis.TAMAGUI_DITW = true;
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
