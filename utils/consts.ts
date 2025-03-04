import Constants from "expo-constants";
import { Platform } from "react-native";

export const PAYER_ACCOUNTS = ["5UPgHdhgawsM6pvrTsyoraYA1AAGqyiCNWueBRrwzN6N"];
export const FALLBACK_TOKEN_LIST =
  "https://raw.githubusercontent.com/solana-labs/token-list/refs/heads/main/src/tokens/solana.tokenlist.json";
export const PLACEHOLDER_IMAGE =
  "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png";

export const RPC_ENDPOINT = "https://rpc.revibase.com";

export const JITO_API_URL = `https://mainnet.block-engine.jito.wtf/api/v1/bundles`;

const APP_IDENTIFIER =
  Platform.OS === "ios"
    ? Constants.expoConfig?.ios?.bundleIdentifier
    : Constants.expoConfig?.android?.package;

<<<<<<< Updated upstream
export const CLOUD_PRIVATE_KEY = "/" + APP_IDENTIFIER + "-" + "private-key.txt";
export const CLOUD_SEED_PHRASE = "/" + APP_IDENTIFIER + "-" + "seed-phrase.txt";
export const CLOUD_PUBLIC_KEY = "/" + APP_IDENTIFIER + "-" + "public-key.txt";

export const DEVICE_PRIVATE_KEY = APP_IDENTIFIER + "-" + "DEVICE-PRIVATE-KEY";
=======
>>>>>>> Stashed changes
export const DEVICE_SEED_PHRASE = APP_IDENTIFIER + "-" + "DEVICE-SEED-PHRASE";
