import { Timestamp } from "@react-native-firebase/firestore";
import { Permissions } from "@revibase/multi-wallet";
import { DAS } from "@revibase/token-transfer";
import { Connection, PublicKey } from "@solana/web3.js";
import { FALLBACK_TOKEN_LIST, PAYER_ACCOUNTS } from "./consts";
import { SignerType, WalletType } from "./enums";
import { TransactionSigner } from "./types";

export async function getAsset(mint: string, connection: Connection) {
  const response = await fetch(connection.rpcEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "",
      method: "getAsset",
      params: {
        id: mint,
      },
    }),
  });
  const data = (await response.json()).result as
    | DAS.GetAssetResponse
    | undefined;
  if (!data) return undefined;

  if (data.content?.metadata.name) return data;

  const fallbackList = await fetchFallbackTokenList();
  const fallbackMap = Object.fromEntries(
    fallbackList.tokens.map((token) => [token.address, token])
  );

  const fallbackMetadata = fallbackMap[data.id] ?? {};
  return {
    ...data,
    content: {
      ...data.content,
      metadata: {
        ...fallbackMetadata,
        description: "",
      },
    },
  } as DAS.GetAssetResponse;
}
export async function getAssetByOwner(wallet: string, connection: Connection) {
  const response = await fetch(connection.rpcEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "my-id",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: wallet,
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
  if (!data) return undefined;

  const itemsWithNoMetadata = data.items.filter(
    (x) => !x.content?.metadata?.name
  );
  if (itemsWithNoMetadata.length === 0) return data;

  const fallbackList = await fetchFallbackTokenList();
  const fallbackMap = Object.fromEntries(
    fallbackList.tokens.map((token) => [token.address, token])
  );

  data.items = data.items.map((x) => {
    if (x.content?.metadata?.name) return x;

    const fallbackMetadata = fallbackMap[x.id] ?? {};
    return {
      ...x,
      content: {
        ...x.content,
        metadata: {
          ...fallbackMetadata,
          description: "",
        },
      },
    } as DAS.GetAssetResponse;
  });

  return data;
}

export const fetchFallbackTokenList = async () => {
  const result = (await (await fetch(FALLBACK_TOKEN_LIST)).json()) as {
    tokens: {
      chainId: number;
      address: string;
      symbol: string;
      name: string;
      decimals: number;
      logoUri: string;
    }[];
  };
  return result;
};

export const getSponsoredFeePayer = () => {
  return PAYER_ACCOUNTS[Math.floor(Math.random() * PAYER_ACCOUNTS.length)];
};

export const getMainWalletFromSigners = (
  signers: TransactionSigner[],
  defaultWallet: string | undefined | null
) => {
  const signer =
    signers.find((x) => x.key == defaultWallet) ||
    signers.find((x) => x.type === SignerType.DEVICE) ||
    signers.find((x) => x.type === SignerType.CLOUD) ||
    signers.find((x) => x.type === SignerType.NFC) ||
    null;
  if (!signer) {
    throw new Error("Main Wallet not found.");
  }
  return signer;
};

export function getSignerTypeFromAddress(
  x: { pubkey: string; createKey?: string },
  deviceWalletPublicKey: string | null | undefined,
  cloudWalletPublicKey: string | null | undefined
): SignerType {
  return deviceWalletPublicKey && x.pubkey === deviceWalletPublicKey
    ? SignerType.DEVICE
    : cloudWalletPublicKey && x.pubkey === cloudWalletPublicKey
    ? SignerType.CLOUD
    : x.pubkey === x.createKey
    ? SignerType.NFC
    : SignerType.UNKNOWN;
}
export function getSignerTypeFromWalletType(
  type: WalletType | undefined
): SignerType {
  return type === WalletType.DEVICE
    ? SignerType.DEVICE
    : type === WalletType.CLOUD
    ? SignerType.CLOUD
    : type === WalletType.MULTIWALLET
    ? SignerType.NFC
    : SignerType.UNKNOWN;
}

export function getPermissionsFromSignerType(type: SignerType) {
  switch (type) {
    case SignerType.NFC:
      return Permissions.all();
    case SignerType.CLOUD:
      return Permissions.all();
    case SignerType.DEVICE:
      return Permissions.all();
    default:
      return null;
  }
}

export function getTotalValueFromWallet(
  assets: DAS.GetAssetResponseList | undefined | null
) {
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
  const maxSafeInt = Number.MAX_SAFE_INTEGER;
  return Math.floor(Math.random() * (maxSafeInt + 1));
}

export function formatFirebaseTimestampToRelativeTime(
  timestamp: Timestamp | null | undefined
) {
  if (!timestamp) {
    return "";
  }
  const now = new Date().getTime() / 1000;
  const date = timestamp.seconds;
  const diffInSeconds = Math.floor(now - date);

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
    compression: {
      compressed: false,
    },
    content: {
      json_uri: "",
      links: {
        image:
          "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
      },
      metadata: { name: "Solana", symbol: "SOL", description: "" },
    },
    id: PublicKey.default.toString(),
    interface: "Custom",
    token_info: {
      decimals: 9,
      price_info: {
        currency: "USDC",
        price_per_token: nativeBalance?.price_per_sol || 0,
      },
      balance: nativeBalance?.lamports,
      symbol: "SOL",
      token_program: PublicKey.default.toString(),
    },
  } as unknown as DAS.GetAssetResponse;
};

export function proxify(image: string) {
  return `https://proxy.revibase.com/?image=${image}`;
}
