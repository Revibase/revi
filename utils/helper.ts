import { Connection, PublicKey } from "@solana/web3.js";

import { BN } from "@coral-xyz/anchor";
import { AesCmac } from "aes-cmac";
import { ec as EC } from "elliptic";
import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as IntentLauncher from "expo-intent-launcher";
import { Linking, Platform } from "react-native";
import nacl from "tweetnacl";
import { program } from "./program";
import { DAS } from "./types/das";

export function getMultiSigFromAddress(address: PublicKey) {
  const [multisigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("multi_wallet"), address.toBuffer()],
    program.programId
  );

  return multisigPda;
}

export function getVaultFromAddress({
  address,
  vault_index = 0,
}: {
  address: PublicKey;
  vault_index?: number;
}) {
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

export function toLittleEndian(bigEndianArray: number[]) {
  const chunkSize = 32;
  const littleEndianArray: number[] = [];
  for (let i = 0; i < bigEndianArray.length; i += chunkSize) {
    const chunk = bigEndianArray.slice(i, i + chunkSize);
    littleEndianArray.push(...chunk.reverse());
  }
  return littleEndianArray;
}

export async function getAsset(mint: PublicKey, connection: Connection) {
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
        id: mint.toString(),
      },
    }),
  });
  const data = (await response.json()).result as DAS.GetAssetResponse;
  return data;
}

export async function getAssetByOwner(
  wallet: PublicKey,
  connection: Connection
) {
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

export const generateNistP256KeyPair = () => {
  const ec = new EC("p256"); // NIST P-256 (secp256r1)
  const keyPair = ec.genKeyPair();
  return keyPair;
};

export const verifySignature = async (
  PublicKey: number[],
  msg: number[],
  signature: number[]
) => {
  const ec = new EC("p256");
  const keyPair = ec.keyFromPublic(PublicKey);
  const hash = await Crypto.digest(
    Crypto.CryptoDigestAlgorithm.SHA256,
    new Uint8Array(msg)
  );
  return keyPair.verify(Buffer.from(hash), signature);
};

export const verifyEd25519Signature = (
  PublicKey: number[],
  msg: number[],
  signature: number[]
) => {
  return nacl.sign.detached.verify(
    new Uint8Array(msg),
    new Uint8Array(signature),
    new Uint8Array(PublicKey)
  );
};

export const deriveSessionKeys = async (
  ephermeralKey: EC.KeyPair,
  sessionAddress: number[],
  challenge: number[]
) => {
  const ec = new EC("p256");
  const sessionPubKey = ec.keyFromPublic(sessionAddress, "hex");
  const sharedSecret = ephermeralKey.derive(sessionPubKey.getPublic());

  const inputForMasterKey = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x01]),
    Buffer.from(sharedSecret.toArrayLike(Buffer, "be", 32)),
    Buffer.from(challenge),
    Buffer.from([0x01, 0x33, 0x88, 0x10]),
  ]);

  const masterKey = Buffer.from(
    await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, inputForMasterKey)
  ).slice(0, 16);

  const ENC = await cmac(
    masterKey,
    Buffer.concat([Buffer.alloc(12, 0x00), Buffer.from([0x04, 0x80, 0x01])])
  );
  const CMAC = await cmac(
    masterKey,
    Buffer.concat([Buffer.alloc(12, 0x00), Buffer.from([0x06, 0x80, 0x01])])
  );
  const RMAC = await cmac(
    masterKey,
    Buffer.concat([Buffer.alloc(12, 0x00), Buffer.from([0x07, 0x80, 0x01])])
  );

  return { masterKey, ENC, CMAC, RMAC };
};

export const cmac = async (key: Buffer, msg: Buffer) => {
  const aesCmac = new AesCmac(key);
  return Buffer.from(await aesCmac.calculate(msg));
};

export const validateResponse = async (
  rmacKey: Buffer,
  input: number[],
  response: number[]
) => {
  return (await cmac(rmacKey, Buffer.from(input))).equals(
    Buffer.from(response)
  );
};

export const encodeTLVLength = (length: number): number[] => {
  if (length <= 127) {
    // Single-byte encoding for lengths ≤ 127
    return [length];
  } else if (length <= 255) {
    // Two-byte encoding: 0x81 followed by the length
    return [0x81, length];
  } else if (length <= 65535) {
    // Three-byte encoding: 0x82 followed by the length in big-endian
    return [0x82, (length >> 8) & 0xff, length & 0xff];
  } else {
    throw new Error("Length exceeds maximum supported size of 65535.");
  }
};
export const encodeLength = (length: number): number[] => {
  if (length <= 255) {
    return [length];
  } else {
    return [0x00, (length >> 8) & 0xff, length & 0xff];
  }
};

export function parseSecureObjectPayload(payload: number[]) {
  const parsedData = new Map<string, number[]>();
  let index = 0;

  while (index < payload.length) {
    const tag = payload[index];
    index += 1;

    let length = payload[index];
    index += 1;

    if (length === 0x81) {
      length = payload[index];
      index += 1;
    } else if (length === 0x82) {
      length = (payload[index] << 8) | payload[index + 1];
      index += 2;
    }
    const value = payload.slice(index, index + length);
    index += length;

    switch (tag) {
      case 0x41:
        parsedData.set("TAG_1", value);
        break;
      case 0x42:
        parsedData.set("TAG_2", value);
        break;
      case 0x43:
        parsedData.set("TAG_3", value);
        break;
      case 0x44:
        parsedData.set("TAG_4", value);
        break;
      case 0x45:
        parsedData.set("TAG_5", value);
        break;
      case 0x46:
        parsedData.set("TAG_6", value);
        break;
      default:
        break;
    }
  }

  return Object.fromEntries(parsedData);
}

export async function verifyAndExtractParsedAddress(
  parsedData: {
    [k: string]: number[];
  },
  attestationKey: number[]
) {
  if (
    await verifySignature(
      attestationKey,
      Array.from(
        Buffer.concat([
          Buffer.from(parsedData["TAG_1"]),
          Buffer.from(parsedData["TAG_2"]),
          Buffer.from(parsedData["TAG_3"]),
          Buffer.from(parsedData["TAG_4"]),
          Buffer.from(parsedData["TAG_5"]),
        ])
      ),
      parsedData["TAG_6"]
    )
  ) {
    return parsedData["TAG_1"];
  }
  return null;
}

export function extractAttributes(parsedData: number[]) {
  const objectId = parsedData.slice(0, 4);
  const objectClass = parsedData[4];
  const authenticationIndicator = parsedData[5];
  const authCounter = parsedData.slice(6, 8);
  const authID = parsedData.slice(8, 12);
  const maxAuthAttempt = parsedData.slice(13, 14);
  const policy = parsedData.slice(14, parsedData.length - 1);
  const origin = parsedData[parsedData.length - 1];
  return {
    objectId,
    objectClass,
    authenticationIndicator,
    authCounter,
    authID,
    maxAuthAttempt,
    policy,
    origin,
  };
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
