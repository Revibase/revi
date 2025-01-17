import { Connection, PublicKey } from "@solana/web3.js";

import { BN } from "@coral-xyz/anchor";
import { Timestamp } from "@react-native-firebase/firestore";
import Constants from "expo-constants";
import * as IntentLauncher from "expo-intent-launcher";
import { Linking, Platform } from "react-native";
import { RPC_ENDPOINT } from "./consts";
import { SignerType } from "./enums/transaction";
import { program } from "./program";
import { DAS } from "./types/das";
import { TransactionSigner } from "./types/transaction";

export function getMultiSigFromAddress(address: PublicKey) {
  const [multisigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("multi_wallet"), new PublicKey(address).toBuffer()],
    program.programId
  );

  return multisigPda;
}

export function getEscrow(walletAddress: PublicKey, identifier: number) {
  const [escrow] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("escrow"),
      new PublicKey(walletAddress).toBuffer(),
      new BN(identifier).toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );
  return escrow;
}

export function getEscrowNativeVault(
  walletAddress: PublicKey,
  identifier: number
) {
  const [escrow] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("escrow"),
      new PublicKey(walletAddress).toBuffer(),
      new BN(identifier).toArrayLike(Buffer, "le", 8),
      Buffer.from("vault"),
    ],
    program.programId
  );
  return escrow;
}

export function getVaultFromAddress(address: PublicKey, vault_index = 0) {
  const multisigPda = getMultiSigFromAddress(address);
  const [multisigVaultPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("multi_wallet"),
      multisigPda.toBuffer(),
      Buffer.from("vault"),
      new BN(vault_index).toArrayLike(Buffer, "le", 2),
    ],
    program.programId
  );
  return multisigVaultPda;
}

export async function getAssetProof(mint: PublicKey, connection?: Connection) {
  const response = await fetch(connection?.rpcEndpoint || RPC_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "text",
      method: "getAssetProof",
      params: {
        id: mint.toString(),
      },
    }),
  });
  const data = (await response.json()).result as DAS.GetAssetProofResponse;
  return data;
}

export async function getAsset(mint: PublicKey, connection?: Connection) {
  const response = await fetch(connection?.rpcEndpoint || RPC_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "",
      method: "getAsset",
      params: {
        id: mint.toString(),
      },
    }),
  });
  const data = (await response.json()).result as DAS.GetAssetResponse;
  return data;
}

export async function getAssetBatch(mints: string[]) {
  const response = await fetch(RPC_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "",
      method: "getAssetBatch",
      params: {
        ids: mints,
        displayOptions: {
          showCollectionMetadata: true,
        },
      } as DAS.GetAssetBatchRequest,
    }),
  });
  const data = (await response.json()).result as DAS.GetAssetResponse[];
  return data;
}

export async function getAssetByOwner(wallet: PublicKey) {
  const response = await fetch(RPC_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "my-id",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: wallet.toString(),
        displayOptions: {
          showFungible: true,
          showNativeBalance: true,
        },
      },
    }),
  });
  const data = (await response.json()).result as
    | DAS.GetAssetResponseList
    | undefined;
  return data;
}

const pkg = Constants.expoConfig
  ? Constants.expoConfig.android?.package
  : "host.exp.exponent";
export const openAppSettings = () => {
  if (Platform.OS === "ios") {
    Linking.openURL("app-settings:");
  } else {
    IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
      { data: "package:" + pkg }
    );
  }
};

export const getFeePayerFromSigners = (signers: TransactionSigner[]) => {
  const feePayer =
    signers.find((x) => x.type === SignerType.NFC)?.key ||
    signers.find((x) => x.type === SignerType.DEVICE)?.key ||
    signers.find((x) => x.type === SignerType.CLOUD)?.key ||
    null;
  if (!feePayer) {
    throw new Error("Fee payer not found.");
  }
  return feePayer;
};

export function getSignerTypeFromAddress(
  x: { pubkey: PublicKey; label?: number | null },
  deviceWalletPublicKey: PublicKey | null | undefined,
  cloudWalletPublicKey: PublicKey | null | undefined
): SignerType {
  return deviceWalletPublicKey &&
    x.pubkey.toString() === deviceWalletPublicKey.toString()
    ? SignerType.DEVICE
    : cloudWalletPublicKey &&
      x.pubkey.toString() === cloudWalletPublicKey.toString()
    ? SignerType.CLOUD
    : x.label === 0
    ? SignerType.NFC
    : SignerType.UNKNOWN;
}

export function getLabelFromSignerType(type: SignerType) {
  switch (type) {
    case SignerType.NFC:
      return 0;
    case SignerType.DEVICE:
      return 1;
    case SignerType.CLOUD:
      return 2;
    default:
      return null;
  }
}

export function getTotalValueFromWallet(assets: DAS.GetAssetResponseList) {
  return (
    (assets?.nativeBalance.total_price ?? 0) +
    (assets?.items.reduce(
      (sum, prev) =>
        ((prev.token_info?.balance || 0) /
          10 ** (prev.token_info?.decimals || 0)) *
          (prev.token_info?.price_info?.price_per_token ?? 0) +
        sum,
      0
    ) ?? 0)
  );
}

export function getRandomU64() {
  // Generate a random number within the safe integer range
  const maxSafeInt = Number.MAX_SAFE_INTEGER;
  return Math.floor(Math.random() * (maxSafeInt + 1)); // +1 to include the maximum value
}

export function formatFirebaseTimestampToRelativeTime(
  timestamp: Timestamp | null | undefined
) {
  if (!timestamp) {
    return "";
  }
  const now = new Date().getTime() / 1000;
  const date = timestamp.seconds;
  const diffInSeconds = Math.floor(now - date); // Difference in seconds

  if (diffInSeconds < 60) {
    return diffInSeconds === 1
      ? `one second ago`
      : `${diffInSeconds} seconds ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1
      ? "one minute ago"
      : `${diffInMinutes} minutes ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? "one hour ago" : `${diffInHours} hours ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return diffInDays === 1 ? "one day ago" : `${diffInDays} days ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return diffInWeeks === 1 ? "one week ago" : `${diffInWeeks} weeks ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? "one month ago" : `${diffInMonths} months ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return diffInYears === 1 ? "one year ago" : `${diffInYears} years ago`;
}

export function formatAmount(amount: number, maxDecimals = 5) {
  if (typeof amount !== "number") {
    throw new Error("Amount must be a number");
  }

  return `${amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  })}`;
}
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
