import { ec as EC } from "elliptic";
import * as Crypto from "expo-crypto";
import { ASN1HEX, X509 } from "jsrsasign";

const ec = new EC("p256");
const x509 = new X509();
/**
 * Converts a big-endian array to a little-endian array.
 * @param {number[]} bigEndianArray - The big-endian array.
 * @returns {number[]} The little-endian array.
 */
export function toLittleEndian(bigEndianArray: number[]): number[] {
  const chunkSize = 32;
  const littleEndianArray: number[] = [];
  for (let i = 0; i < bigEndianArray.length; i += chunkSize) {
    const chunk = bigEndianArray.slice(i, i + chunkSize);
    littleEndianArray.push(...chunk.reverse());
  }
  return littleEndianArray;
}

export function encodeTLVLength(length: number): number[] {
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
}
export function encodeLength(length: number): number[] {
  if (length <= 255) {
    return [length];
  } else {
    return [0x00, (length >> 8) & 0xff, length & 0xff];
  }
}

/**
 * Parses the secure object payload from the NFC chip.
 * @param {number[]} payload - The payload to parse.
 * @returns {Record<string, number[]>} The parsed data.
 */
export function parseSecureObjectPayload(
  payload: number[]
): Record<string, number[]> {
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

/**
 * Verifies and extracts the parsed address from the secure object payload.
 * @param {Record<string, number[]>} parsedData - The parsed data.
 * @param {number[]} attestationKey - The attestation key.
 * @returns {Promise<number[] | null>} The verified address or null if verification fails.
 */
export async function verifyAndExtractParsedAddress(
  parsedData: {
    [k: string]: number[];
  },
  attestationKey: EC.KeyPair
): Promise<number[] | null> {
  const dataToVerify = Buffer.concat([
    Buffer.from(parsedData["TAG_1"]),
    Buffer.from(parsedData["TAG_2"]),
    Buffer.from(parsedData["TAG_3"]),
    Buffer.from(parsedData["TAG_4"]),
    Buffer.from(parsedData["TAG_5"]),
  ]);
  const hash = await Crypto.digest(
    Crypto.CryptoDigestAlgorithm.SHA256,
    new Uint8Array(dataToVerify)
  );
  if (
    attestationKey.verify(Buffer.from(hash), Buffer.from(parsedData["TAG_6"]))
  ) {
    return parsedData["TAG_1"];
  }
  return null;
}

/**
 * Extracts attributes from the parsed data.
 * @param {number[]} parsedData - The parsed data.
 * @returns {Record<string, any>} The extracted attributes.
 */
export function extractAttributes(parsedData: number[]): Record<string, any> {
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

/**
 * Verifies the stored data from the NFC chip.
 * @param {number[]} response - The response from the NFC chip.
 * @param {number[]} attestationKey - The attestation key.
 * @returns {Promise<{data: number[], attributes: any}>} The verified data and its attributes.
 * @throws Will throw an error if verification fails.
 */
export async function verifyData(
  response: number[],
  attestationKey: EC.KeyPair,
  errorMsg: string
): Promise<{ data: number[]; attributes: any }> {
  const parsed = parseSecureObjectPayload(response);
  const data = await verifyAndExtractParsedAddress(parsed, attestationKey);
  if (!data) throw new Error(errorMsg);
  return { data, attributes: extractAttributes(parsed["TAG_2"]) };
}

/**
 * Parses an X.509 certificate from a number array and verifies its signature.
 * @param {number[]} derCert - The DER-encoded certificate as a number array.
 * @param {KJUR.crypto.ECDSA} certificatePubkey - The public key to verify the certificate's signature.
 * @returns {EC.KeyPair} The parsed certificate public key.
 * @throws {Error} If the certificate signature is invalid.
 */
export async function parseX509FromNumberArray(
  derCert: number[],
  certificatePubkey: EC.KeyPair
): Promise<EC.KeyPair> {
  const hexCert = Buffer.from(derCert).toString("hex");
  x509.readCertHex(hexCert);
  const tbsCert = ASN1HEX.getTLVbyList(x509.hex, 0, [0], "30");
  if (tbsCert) {
    const hash = await Crypto.digest(
      Crypto.CryptoDigestAlgorithm.SHA256,
      new Uint8Array(Buffer.from(tbsCert, "hex"))
    );
    const signature = x509.getSignatureValueHex();
    if (certificatePubkey.verify(Buffer.from(hash), signature)) {
      return ec.keyFromPublic(x509.getSPKIValue(), "hex");
    }
  }
  throw new Error("Unauthorised certificate signature.");
}
