import { PublicKey } from "@solana/web3.js";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { BLOCKCHAIN } from "./enums/chain";
import { Chain } from "./types/chain";

export const ADDRESS_LOOK_UP_TABLE = new PublicKey(
  "Hg5CGGARH2PSh7ceV8KVqZ6VqW5bnFqdFabziVddHsDZ"
);

export const CHAIN: Record<string, Chain> = {
  SOLANA: {
    chainId: [0x01, 0x00, 0x00, 0x00],
    curve: 0x40,
    name: BLOCKCHAIN.SOLANA,
    assetId: [0x00, 0x00, 0x00, 0x00],
  },
};

export const PLACEHOLDER_IMAGE =
  "https://firebasestorage.googleapis.com/v0/b/magpie-6d528.firebasestorage.app/o/test.png?alt=media&token=d88e03a6-3a92-49e7-8e13-9936e6fcca9c";

export const RPC_ENDPOINT = "https://rpc.blinksfeed.com";

// Filenames
const APP_IDENTIFIER =
  (Platform.OS === "ios"
    ? Constants.expoConfig?.ios?.bundleIdentifier
    : Constants.expoConfig?.android?.package) || "";

export const CLOUD_PRIVATE_KEY = "/" + APP_IDENTIFIER + "-" + "private-key.txt";
export const CLOUD_SEED_PHRASE = "/" + APP_IDENTIFIER + "-" + "seed-phrase.txt";
export const CLOUD_PUBLIC_KEY = "/" + APP_IDENTIFIER + "-" + "public-key.txt";

export const DEVICE_PRIVATE_KEY = APP_IDENTIFIER + "-" + "DEVICE-PRIVATE-KEY";
export const DEVICE_SEED_PHRASE = APP_IDENTIFIER + "-" + "DEVICE-SEED-PHRASE";
export const DEVICE_PUBLIC_KEY = APP_IDENTIFIER + "-" + "DEVICE-PUBLIC-KEY";
