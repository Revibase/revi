import { Connection, PublicKey } from "@solana/web3.js";

import { BN } from "@coral-xyz/anchor";
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
    [Buffer.from("multi_wallet"), address.toBuffer()],
    program.programId
  );

  return multisigPda;
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
      },
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
    signers.find((x) => x.type === SignerType.PRIMARY)?.key ||
    signers.find((x) => x.type === SignerType.SECONDARY)?.key ||
    null;
  if (!feePayer) {
    throw new Error("Fee payer not found.");
  }
  return feePayer;
};

export function getSignerTypeFromAddress(
  x: PublicKey,
  createKey: PublicKey | null | undefined,
  primaryAddress: PublicKey | null | undefined,
  secondaryAddress: PublicKey | null | undefined
): SignerType {
  return x.toString() === primaryAddress?.toString()
    ? SignerType.PRIMARY
    : x.toString() === secondaryAddress?.toString()
    ? SignerType.SECONDARY
    : x.toString() === createKey?.toString()
    ? SignerType.NFC
    : SignerType.UNKNOWN;
}
