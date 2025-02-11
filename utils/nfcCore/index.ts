import NfcCore from "@revibase/nfc-core";
import { Platform } from "react-native";
import NfcManager from "react-native-nfc-manager";

export const nfcCore = new NfcCore(NfcManager, Platform.OS === "android");
