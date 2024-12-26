import { PublicKey } from "@solana/web3.js";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { BLOCKCHAIN } from "./enums/chain";
import { Chain } from "./types/chain";
import { DAS } from "./types/das";

export const ADDRESS_LOOK_UP_TABLE = new PublicKey(
  "Hg5CGGARH2PSh7ceV8KVqZ6VqW5bnFqdFabziVddHsDZ"
);

export const ASSET_IDENTIFIER = [0x00, 0x00, 0x02, 0x00];

export const AUTHENTICATION_ID = [0x7f, 0xff, 0x02, 0x01];

export const ATTESTATION_KEY = [0xf0, 0x00, 0x00, 0x12];

export const AID = [
  0xa0, 0x00, 0x00, 0x03, 0x96, 0x54, 0x53, 0x00, 0x00, 0x00, 0x01, 0x03, 0x00,
  0x00, 0x00, 0x00,
];

export const CHAIN: Record<string, Chain> = {
  SOLANA: {
    identifier: [0x00, 0x00, 0x02, 0x01],
    curve: 0x40,
    name: BLOCKCHAIN.SOLANA,
  },
};

export const RPC_ENDPOINT = "https://rpc.blinksfeed.com";

export const APP_IDENTIFIER =
  (Platform.OS === "ios"
    ? Constants.expoConfig?.ios?.bundleIdentifier
    : Constants.expoConfig?.android?.package) || "";

export const SOL_NATIVE_MINT = (
  nativeBalance:
    | {
        lamports: number;
        price_per_sol: number;
        total_price: number;
      }
    | undefined
) => {
  return {
    authorities: [
      {
        address: "AqH29mZfQFgRpfwaPoTMWSKJ5kqauoc1FwVBRksZyQrt",
        scopes: [],
      },
    ],
    burnt: false,
    compression: {
      asset_hash: "",
      compressed: false,
      creator_hash: "",
      data_hash: "",
      eligible: false,
      leaf_id: 0,
      seq: 0,
      tree: "",
    },
    content: {
      $schema: "https://schema.metaplex.com/nft1.0.json",
      files: [[Object]],
      json_uri: "",
      links: {
        image:
          "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
      },
      metadata: { name: "Solana", symbol: "SOL", description: "" },
    },
    creators: [],
    grouping: [],
    id: PublicKey.default.toString(),
    interface: "Custom",
    mutable: true,
    ownership: {
      delegated: false,
      frozen: false,
      owner: "",
      ownership_model: "token",
    },
    royalty: {
      basis_points: 0,
      locked: false,
      percent: 0,
      primary_sale_happened: false,
      royalty_model: "creators",
    },
    token_info: {
      decimals: 9,
      price_info: {
        currency: "USDC",
        price_per_token: nativeBalance?.price_per_sol || 0,
      },
      balance: nativeBalance?.lamports,
      symbol: "SOL",
      token_program: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    },
  } as DAS.GetAssetResponse;
};
