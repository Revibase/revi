import Constants from "expo-constants";
import { Platform } from "react-native";

export const FALLBACK_TOKEN_LIST =
  "https://raw.githubusercontent.com/solana-labs/token-list/refs/heads/main/src/tokens/solana.tokenlist.json";

export const PLACEHOLDER_IMAGE =
  "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png";

export const RPC_ENDPOINT = "https://rpc.revibase.com";

export const TYPESENSE_ENDPOINT = "typesense.revibase.com";

export const JITO_API_URL = `https://mainnet.block-engine.jito.wtf/api/v1/bundles`;

export const FEE_ACCOUNT = "5UPgHdhgawsM6pvrTsyoraYA1AAGqyiCNWueBRrwzN6N";

const APP_IDENTIFIER =
  Platform.OS === "ios"
    ? Constants.expoConfig?.ios?.bundleIdentifier
    : Constants.expoConfig?.android?.package;

export const DEVICE_PRIVATE_KEY = APP_IDENTIFIER + "-" + "DEVICE-PRIVATE-KEY";
export const DEVICE_SEED_PHRASE = APP_IDENTIFIER + "-" + "DEVICE-SEED-PHRASE";
export const DEVICE_PUBLIC_KEY = APP_IDENTIFIER + "-" + "DEVICE-PUBLIC-KEY";
