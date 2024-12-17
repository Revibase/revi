import { CHAIN } from "../consts";

export const signEd25519 = (message: number[]) => {
  const payload = [
    0x41,
    0x04,
    ...CHAIN.SOLANA.identifier,
    0x42,
    0x01,
    0xa3,
    0x43,
    ...encodeTLVLength(message.length),
    ...message,
  ];

  return [
    0x80,
    0x03,
    0x0c,
    0x09,
    ...encodeLength(payload.length),
    ...payload,
    ...(payload.length > 255 ? [0x00, 0x40] : [0x00]),
  ];
};

const encodeTLVLength = (length: number): number[] => {
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
const encodeLength = (length: number): number[] => {
  if (length <= 255) {
    return [length];
  } else {
    return [0x00, (length >> 8) & 0xff, length & 0xff];
  }
};
