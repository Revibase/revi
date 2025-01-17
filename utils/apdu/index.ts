import bs58 from "bs58";
import { ec as EC } from "elliptic";
import { Alert, Platform } from "react-native";
import NfcManager, { NfcError, NfcTech } from "react-native-nfc-manager";
import { CHAIN } from "utils/consts";
import { Chain } from "../types/chain";
import { createAddress } from "./createAddress";
import { readData } from "./readData";
import { readDataWithAttestation } from "./readDataWAttestation";
import { selectApplet } from "./selectApplet";
import { signEd25519 } from "./signEd25519";
import { parseX509FromNumberArray, toLittleEndian, verifyData } from "./utils";
/**
 * Singleton class to manage NFC operations.
 */
class NfcProxy {
  private static instance: NfcProxy;
  private isReady: boolean = false;
  private static TIMEOUT: number = 5 * 1000;
  private static MAX_APDU_SIZE: number = 900;
  private static ATTESTATION_KEY: number[] = [0xf0, 0x00, 0x00, 0x12]; // provisioned attestation key by NXP
  private static ATTESTATION_KEY_CERT: number[] = [0xf0, 0x00, 0x00, 0x13]; // provisioned attestation key certificate by NXP
  private static AID: number[] = [
    0xa0, 0x00, 0x00, 0x03, 0x96, 0x54, 0x53, 0x00, 0x00, 0x00, 0x01, 0x03,
    0x00, 0x00, 0x00, 0x00,
  ];
  private static CERTIFICATE_PUBKEY = new EC("p256").keyFromPublic(
    "04999e37435ffbdc7078f13a3e005ba9dba6c6f89bd150d779903daff84b2520cdee050155bead493f625f894eb04a54315e86844ee4a58c78471e9ca6149163b4",
    "hex"
  ); // extracted from the immediate certificate by NXP

  private constructor() {
    this.init();
  }

  /**
   * Gets the singleton instance of NfcProxy.
   * @returns {NfcProxy} The singleton instance.
   */
  static getInstance(): NfcProxy {
    if (!NfcProxy.instance) {
      NfcProxy.instance = new NfcProxy();
    }
    return NfcProxy.instance;
  }

  /**
   * Closes the NFC connection.
   */
  public async close() {
    await NfcManager.cancelTechnologyRequest();
  }

  /**
   * Reads secure element data from the NFC chip.
   * @param {Chain} blockchain - The blockchain to read from.
   * @param {number[]} [assetIdentifier] - Asset identifier for the stored asset. If not provided, only the wallet address will be read.
   * @returns {Promise<{walletAddress: PublicKey; mint?: PublicKey} | null>} The wallet address and optional mint.
   * @throws Will throw an error if the NFC operation fails.
   */
  public async readSecureElement(
    blockchain: Chain
  ): Promise<{ walletAddress: string; mint: string | null } | undefined> {
    try {
      await this.ensureReady();
      const attestationKeyCertificateResponse = await this.transceiveAndCheck(
        readData(NfcProxy.ATTESTATION_KEY_CERT),
        "Reading attestation key certificate failed"
      );

      const attestationKey = await parseX509FromNumberArray(
        attestationKeyCertificateResponse.slice(4),
        NfcProxy.CERTIFICATE_PUBKEY
      );
      const storedAddress = await this.readStoredPubkey(
        blockchain,
        attestationKey
      );

      const storedAsset = await this.readStoredAsset(
        blockchain,
        attestationKey
      );

      return {
        walletAddress: bs58.encode(toLittleEndian(storedAddress)),
        mint: storedAsset ? bs58.encode(storedAsset.slice(1)) : null,
      };
    } catch (error) {
      if (!(error instanceof NfcError.UserCancel)) {
        throw new Error(error.message);
      }
    } finally {
      await this.close();
    }
  }
  /**
   * Signs a raw payload using the NFC chip.
   * @param {Uint8Array} payload - The payload to sign.
   * @returns {Promise<number[]>} The signed payload.
   * @throws Will throw an error if the NFC operation fails.
   */
  public async signRawPayload(payload: Uint8Array): Promise<number[]> {
    try {
      if (payload.length > NfcProxy.MAX_APDU_SIZE) {
        throw new Error(
          `Transaction size cannot exceed ${NfcProxy.MAX_APDU_SIZE} bytes, Size: ${payload.length}`
        );
      }
      await this.ensureReady();
      const response = await this.transceiveAndCheck(
        signEd25519(CHAIN.SOLANA, Array.from(payload)),
        "Signing Transaction failed"
      );
      return toLittleEndian(response.slice(4));
    } catch (error) {
      if (error instanceof NfcError.UserCancel) {
        throw new Error("User has cancelled the request.");
      }
      throw new Error(error.message);
    } finally {
      await this.close();
    }
  }

  /**
   * Ensures that the NFC manager is ready.
   * @throws Will throw an error if the NFC manager is not initialized.
   */
  private async ensureReady() {
    if (!this.isReady) {
      throw new Error("NFC is not initialized.");
    }
    await NfcManager.requestTechnology(NfcTech.IsoDep, {
      invalidateAfterFirstRead: false,
    });
    if (Platform.OS === "android") {
      await NfcManager.setTimeout(NfcProxy.TIMEOUT);
    }
    await this.transceiveAndCheck(
      selectApplet(NfcProxy.AID),
      "Selecting Applet failed"
    );
  }

  /**
   * Initializes the NFC manager.
   */
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
  /**
   * Sends a command to the NFC chip and checks the response.
   * @param {number[]} command - The command to send.
   * @param {string} errorMsg - The error message to throw if the command fails.
   * @returns {Promise<number[]>} The response from the NFC chip.
   * @throws Will throw an error if the command fails.
   */
  private async transceiveAndCheck(
    command: number[],
    errorMsg: string
  ): Promise<number[]> {
    const response = await NfcManager.isoDepHandler.transceive(command);
    if (response.at(-2) !== 0x90 || response.at(-1) !== 0x00) {
      throw new Error(errorMsg);
    }
    return response.slice(0, -2);
  }
  /**
   * Reads the stored public key from the NFC chip.
   * @param {Chain} blockchain - The blockchain to read from.
   * @param {number[]} attestationKey - The attestation key.
   * @returns {Promise<number[]>} The stored public key.
   * @throws Will throw an error if the key attributes are invalid.
   */
  private async readStoredPubkey(
    blockchain: Chain,
    attestationKey: EC.KeyPair
  ): Promise<number[]> {
    const storedPubkey = await this.readStoredDataWithFallback(
      () =>
        readDataWithAttestation(blockchain.chainId, NfcProxy.ATTESTATION_KEY),
      () => createAddress(blockchain),
      attestationKey,
      "Reading Public Key failed",
      "Generating Public Key failed"
    );
    if (!storedPubkey) {
      throw new Error("Unable to read publickey");
    }
    const { data: pubKey, attributes } = storedPubkey;
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

    return pubKey;
  }
  /**
   * Reads the stored asset from the NFC chip.
   * @param {Chain} blockchain - The blockchain to read from.
   * @param {number[]} attestationKey - The attestation key.
   * @returns {Promise<number[]>} The stored asset.
   * @throws Will throw an error if the asset policy is incorrect.
   */
  private async readStoredAsset(
    blockchain: Chain,
    attestationKey: EC.KeyPair
  ): Promise<number[] | null> {
    const assetIdentifier = blockchain.assetId;
    if (!assetIdentifier) {
      return null;
    }
    const storedAsset = await this.readStoredDataWithFallback(
      () => readDataWithAttestation(assetIdentifier, NfcProxy.ATTESTATION_KEY),
      undefined,
      attestationKey,
      "Reading Stored Asset failed",
      undefined
    );
    if (!storedAsset) {
      return null;
    }
    const { data: mint, attributes } = storedAsset;
    if (attributes.policy.join("") !== [8, 0, 0, 0, 0, 0, 32, 0, 0].join("")) {
      throw new Error("Asset is set with wrong policy");
    }
    if (mint[0] !== blockchain.name) {
      throw new Error("Incorrect blockchain id");
    }
    return mint;
  }
  /**
   * Reads stored data from the NFC chip with a fallback to create the data if it doesn't exist.
   * @param {() => number[]} readCommand - The command to read the data.
   * @param {(() => number[]) | undefined} createCommand - The command to create the data.
   * @param {number[]} attestationKey - The attestation key.
   * @param {string} readErrorMsg - The error message to throw if reading fails.
   * @param {string | undefined} createErrorMsg - The error message to throw if creating fails.
   * @returns {Promise<{data: number[], attributes: any}>} The stored data and its attributes.
   * @throws Will throw an error if both reading and creating the data fail.
   */
  private async readStoredDataWithFallback(
    readCommand: () => number[],
    createCommand: (() => number[]) | undefined,
    attestationKey: EC.KeyPair,
    readErrorMsg: string,
    createErrorMsg: string | undefined
  ): Promise<{ data: number[]; attributes: any } | null> {
    try {
      let response = await this.transceiveAndCheck(readCommand(), readErrorMsg);
      return verifyData(response, attestationKey, readErrorMsg);
    } catch {
      if (!createCommand || !createErrorMsg) {
        return null;
      }
      await this.transceiveAndCheck(createCommand(), createErrorMsg);
      const response = await this.transceiveAndCheck(
        readCommand(),
        readErrorMsg
      );
      return verifyData(response, attestationKey, readErrorMsg);
    }
  }
}

export default NfcProxy.getInstance();
