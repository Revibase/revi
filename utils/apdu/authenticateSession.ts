import { ec as EC } from "elliptic";
import * as Crypto from "expo-crypto";
import { AID } from "utils/consts";

export const authenticateSession = async (ephermeralKey: EC.KeyPair) => {
  const part1 = [
    ...[0x4f, 0x10, ...AID],
    ...[0x90, 0x03, 0xab, 0x01, 0x73],
    ...[0x80, 0x01, 0x88],
    ...[0x81, 0x01, 0x10],
  ];
  const part2 = [
    0xb0,
    0x41,
    ...ephermeralKey.getPublic().encode("array", false),
    0xf0,
    0x01,
    0x03,
  ];

  const dataToSign = [
    0xa6,
    part1.length,
    ...part1,
    0x7f,
    0x49,
    part2.length,
    ...part2,
  ];

  const hash = await Crypto.digest(
    Crypto.CryptoDigestAlgorithm.SHA256,
    new Uint8Array(dataToSign)
  );

  const signature = ephermeralKey
    .sign(Buffer.from(hash), { canonical: true })
    .toDER();

  const combined = [...dataToSign, 0x5f, 0x37, signature.length, ...signature];
  return [0x84, 0x88, 0x00, 0x00, combined.length, ...combined];
};
