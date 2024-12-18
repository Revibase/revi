import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import { ec as EC } from "elliptic";
import * as Crypto from "expo-crypto";
import { Alert, Platform } from "react-native";
import NfcManager, { NfcError, NfcTech } from "react-native-nfc-manager";
import nacl from "tweetnacl";
import { readDataWithAttestation } from "utils/apdu/readDataWAttestation";
import { ASSET_IDENTIFIER, ATTESTATION_KEY } from "utils/consts";
import { BLOCKCHAIN } from "utils/enums/chain";
import { Chain } from "../types/chain";
import { createAsset } from "./createAsset";
import { createAddress } from "./createPublicKey";
import { selectApplet } from "./selectApplet";
import { signEd25519 } from "./signEd25519";

class NfcProxy {
  private static instance: NfcProxy;
  private isReady: boolean = false;
  private static TIMEOUT: number = 5 * 1000; // 5s
  private static MAX_APDU_SIZE: number = 900;

  private constructor() {
    this.init();
  }

  static getInstance(): NfcProxy {
    if (!NfcProxy.instance) {
      NfcProxy.instance = new NfcProxy();
    }
    return NfcProxy.instance;
  }

  async close() {
    await NfcManager.cancelTechnologyRequest();
  }

  async readSecureElement(
    blockchain: Chain,
    callback: React.Dispatch<React.SetStateAction<boolean>>
  ) {
    try {
      await this.ensureReady();
      if (Platform.OS === "android") callback(true);
      await NfcManager.requestTechnology(NfcTech.IsoDep, {
        invalidateAfterFirstRead: false,
      });
      if (Platform.OS === "android") {
        await NfcManager.setTimeout(NfcProxy.TIMEOUT);
      }
      await this.transceiveAndCheck(selectApplet, "Selecting Applet failed");
      const attestationKeyResponse = await this.transceiveAndCheck(
        readDataWithAttestation(ATTESTATION_KEY, ATTESTATION_KEY),
        "Reading attestation key failed"
      );
      const attestationKeyResponseParsed = this.parseSecureObjectPayload(
        attestationKeyResponse
      );
      const attestationKey = await this.verifyAndExtractParsedAddress(
        attestationKeyResponseParsed,
        attestationKeyResponseParsed["TAG_1"]
      );
      if (!attestationKey) {
        throw new Error("Unable to verify attestation key!");
      }
      const storedAddress = await this.readStoredPubkey(
        blockchain,
        attestationKey
      );
      const storedAsset = await this.readStoredAsset(
        blockchain,
        attestationKey
      );
      return {
        walletAddress: new PublicKey(
          bs58.encode(this.toLittleEndian(storedAddress))
        ),
        mint: new PublicKey(bs58.encode(storedAsset.slice(1))),
        blockchain: Object.entries(BLOCKCHAIN).find(
          (x) => x[1] == storedAsset[0]
        )?.[1] as BLOCKCHAIN,
      };
    } catch (error) {
      if (error instanceof NfcError.UserCancel) {
        throw new Error("User has cancelled the request.");
      }
      console.log(error.stack);
      throw new Error(
        "An error has occurred while attempting to read the NFC object."
      );
    } finally {
      await NfcManager.cancelTechnologyRequest();
      if (Platform.OS === "android") callback(false);
    }
  }

  async signWithNfcKeypair(
    tx: VersionedTransaction,
    callback: React.Dispatch<React.SetStateAction<boolean>>
  ) {
    try {
      await this.ensureReady();
      if (tx.message.serialize().length > NfcProxy.MAX_APDU_SIZE) {
        throw new Error(
          `Transaction size cannot exceed ${
            NfcProxy.MAX_APDU_SIZE
          } bytes, Size: ${tx.message.serialize().length}`
        );
      }
      if (Platform.OS === "android") callback(true);
      await NfcManager.requestTechnology(NfcTech.IsoDep, {
        invalidateAfterFirstRead: false,
      });
      if (Platform.OS === "android") {
        await NfcManager.setTimeout(NfcProxy.TIMEOUT);
      }
      await this.transceiveAndCheck(selectApplet, "Selecting Applet failed");
      const response = await this.transceiveAndCheck(
        signEd25519(Array.from(tx.message.serialize())),
        "Signing Transaction failed"
      );
      return this.toLittleEndian(response.slice(4));
    } catch (error) {
      if (error instanceof NfcError.UserCancel) {
        throw new Error("User has cancelled the request.");
      }
      throw new Error(error.message);
    } finally {
      await NfcManager.cancelTechnologyRequest();
      if (Platform.OS === "android") callback(false);
    }
  }

  private async ensureReady() {
    if (!this.isReady) {
      throw new Error("NFC is not initialized.");
    }
  }

  private async init() {
    try {
      const supported = await NfcManager.isSupported();
      if (supported) {
        await NfcManager.start();
        this.isReady = true;
      } else {
        Alert.alert("NFC is not supported on this device.");
      }
    } catch (error) {}
  }

  private async transceiveAndCheck(command: number[], errorMsg: string) {
    const response = await NfcManager.isoDepHandler.transceive(command);
    if (response.at(-2) !== 144) {
      throw new Error(errorMsg);
    }
    return response.slice(0, -2);
  }

  private async readStoredPubkey(blockchain: Chain, attestationKey: number[]) {
    const { data: pubKey, attributes } = await this.readStoredDataWithFallback(
      () => readDataWithAttestation(blockchain.identifier, ATTESTATION_KEY),
      () => createAddress(blockchain),
      attestationKey,
      "Reading ed25519 key failed",
      "Generating ed25519 key failed"
    );
    if (attributes.objectClass !== 1) {
      throw new Error("Object is not a valid key");
    }
    if (attributes.origin !== 2) {
      throw new Error("Key is not generated from secure element!");
    }
    if (attributes.authenticationIndicator === 2) {
      throw new Error("Key should not be an authentication object");
    }
    if (attributes.policy.join("") !== [8, 0, 0, 0, 0, 24, 32, 0, 0].join("")) {
      throw new Error("Key policy is not set correctly");
    }
    const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(16)));
    const signatureResponse = await this.transceiveAndCheck(
      signEd25519(randomBytes),
      "Unable to sign message"
    );
    const signature = this.toLittleEndian(signatureResponse.slice(4));
    if (this.verifyEd25519Signature(pubKey, randomBytes, signature)) {
      throw new Error("Unable to verify key's signature");
    }
    return pubKey;
  }

  private async readStoredAsset(blockchain: Chain, attestationKey: number[]) {
    const { data: mint, attributes } = await this.readStoredDataWithFallback(
      () => readDataWithAttestation(ASSET_IDENTIFIER, ATTESTATION_KEY),
      () =>
        createAsset(
          blockchain,
          Array.from(bs58.decode("So11111111111111111111111111111111111111112"))
        ),
      attestationKey,
      "Reading stored asset failed",
      "Creating stored asset failed"
    );
    if (attributes.policy.join("") !== [8, 0, 0, 0, 0, 0, 32, 0, 0].join("")) {
      throw new Error("Asset is set with wrong policy");
    }
    if (mint[0] !== blockchain.name) {
      throw new Error("Incorrect blockchain id");
    }
    return mint;
  }

  private async readStoredDataWithFallback(
    readCommand: () => number[],
    createCommand: () => number[],
    attestationKey: number[],
    readErrorMsg: string,
    createErrorMsg: string
  ) {
    try {
      let response = await this.transceiveAndCheck(readCommand(), readErrorMsg);
      return this.verifyStoredData(response, attestationKey);
    } catch {
      await this.transceiveAndCheck(createCommand(), createErrorMsg);
      const response = await this.transceiveAndCheck(
        readCommand(),
        readErrorMsg
      );
      return this.verifyStoredData(response, attestationKey);
    }
  }

  private verifySignature = async (
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

  private verifyEd25519Signature = (
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

  private parseSecureObjectPayload(payload: number[]) {
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

  private async verifyAndExtractParsedAddress(
    parsedData: {
      [k: string]: number[];
    },
    attestationKey: number[]
  ) {
    if (
      await this.verifySignature(
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

  private extractAttributes(parsedData: number[]) {
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

  private async verifyStoredData(response: number[], attestationKey: number[]) {
    const parsed = this.parseSecureObjectPayload(response);
    const data = await this.verifyAndExtractParsedAddress(
      parsed,
      attestationKey
    );

    if (!data) throw new Error("Unable to retrieve data from secure element");

    return { data, attributes: this.extractAttributes(parsed["TAG_2"]) };
  }

  private toLittleEndian(bigEndianArray: number[]) {
    const chunkSize = 32;
    const littleEndianArray: number[] = [];
    for (let i = 0; i < bigEndianArray.length; i += chunkSize) {
      const chunk = bigEndianArray.slice(i, i + chunkSize);
      littleEndianArray.push(...chunk.reverse());
    }
    return littleEndianArray;
  }
}

export default NfcProxy.getInstance();
