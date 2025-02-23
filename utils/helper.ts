import { Timestamp } from "@react-native-firebase/firestore";
import { Permission, Permissions } from "@revibase/multi-wallet";
import { DAS } from "@revibase/token-transfer";
import { Connection, PublicKey } from "@solana/web3.js";
import { FALLBACK_TOKEN_LIST } from "./consts";
import { SignerType, WalletType } from "./enums";
import { TransactionSigner } from "./types";

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
          showCollectionMetadata: true,
        },
      } as DAS.AssetsByOwnerRequest,
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

export const getTransactionCreatorFromSigners = (
  signers: TransactionSigner[]
) => {
  const signer =
    signers.find((x) => x.type === SignerType.DEVICE) ||
    signers.find((x) => x.type === SignerType.NFC) ||
    null;
  if (!signer) {
    throw new Error("No Elligible Signer not found.");
  }
  return signer;
};

export function getSignerTypeFromAddress(
  x: { pubkey: string; createKey?: string },
  deviceWalletPublicKey: string | null | undefined,
  paymasterWalletPublicKey: string | null | undefined
): SignerType {
  return deviceWalletPublicKey && x.pubkey === deviceWalletPublicKey
    ? SignerType.DEVICE
    : paymasterWalletPublicKey && x.pubkey === paymasterWalletPublicKey
    ? SignerType.PAYMASTER
    : x.pubkey === x.createKey
    ? SignerType.NFC
    : SignerType.UNKNOWN;
}

export function getSignerTypeFromWalletType(
  type: WalletType | undefined
): SignerType {
  return type === WalletType.DEVICE
    ? SignerType.DEVICE
    : type === WalletType.PAYMASTER
    ? SignerType.PAYMASTER
    : type === WalletType.MULTIWALLET
    ? SignerType.NFC
    : SignerType.UNKNOWN;
}

export function getPermissionsFromSignerType(type: SignerType) {
  switch (type) {
    case SignerType.NFC:
      return Permissions.all();
    case SignerType.PAYMASTER:
      return Permissions.fromPermissions([
        Permission.VoteEscrow,
        Permission.VoteTransaction,
      ]);
    case SignerType.DEVICE:
      return Permissions.all();
    default:
      return null;
  }
}

export function parsePermissions(permissions: Permissions | null) {
  if (!permissions) return "No Actions Allowed";
  if (permissions.mask == 63) return "All Actions";
  const result: string[] = [];
  Object.entries(Permission).forEach((value) => {
    if (Permissions.has(permissions, value[1])) {
      result.push(value[0]);
    }
  });
  return result.join(", ");
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

export const USDC_MINT = () => {
  return {
    interface: "FungibleToken",
    id: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    content: {
      $schema: "https://schema.metaplex.com/nft1.0.json",
      json_uri: "",
      files: [
        {
          uri: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
          cdn_uri:
            "https://cdn.helius-rpc.com/cdn-cgi/image//https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
          mime: "image/png",
        },
      ],
      metadata: {
        name: "USD Coin",
        symbol: "USDC",
      },
      links: {
        image:
          "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
      },
    },
    authorities: [
      {
        address: "2wmVCSfPxGPjrnMMn7rchp4uaeoTqN39mXFC2zhPdri9",
        scopes: ["full"],
      },
    ],
    compression: {
      eligible: false,
      compressed: false,
      data_hash: "",
      creator_hash: "",
      asset_hash: "",
      tree: "",
      seq: 0,
      leaf_id: 0,
    },
    grouping: [],
    royalty: {
      royalty_model: "creators",
      target: null,
      percent: 0,
      basis_points: 0,
      primary_sale_happened: false,
      locked: false,
    },
    creators: [],
    ownership: {
      frozen: false,
      delegated: false,
      delegate: null,
      ownership_model: "token",
      owner: "",
    },
    supply: null,
    mutable: true,
    burnt: false,
    token_info: {
      symbol: "USDC",
      supply: 10000,
      decimals: 6,
      token_program: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      price_info: {
        price_per_token: 0.999994,
        currency: "USDC",
      },
      mint_authority: "BJE5MMbqXjVwjAF7oxwPYXnTXDyspzZyt4vwenNw5ruG",
      freeze_authority: "7dGbd2QZcCKcTndnHcTL8q7SMVXAkp688NTQYwrRCrar",
    },
  } as unknown as DAS.GetAssetResponse;
};

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
      supply: 500_000_000, // any number than is more than 1 will do to show that it is fungible
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

export const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timer: NodeJS.Timeout | null = null;

  const debouncedFn = (...args: any[]) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => func(...args), delay);
  };

  debouncedFn.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debouncedFn;
};
