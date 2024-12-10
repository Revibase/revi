import Aes from 'react-native-aes-crypto';
import {cmac, encodeLength, encodeTLVLength} from '../helper';
var aesEcb = require('react-native-aes-ecb');

export const processSessionApdu = async (
  sessionId: number[],
  apdu: number[],
  ENC?: Buffer,
  CMAC?: Buffer,
  encryptionCounter?: Buffer,
) => {
  const payload = [
    0x10,
    sessionId.length,
    ...sessionId,
    0x41,
    ...encodeTLVLength(apdu.length),
    ...apdu,
  ];

  if (!ENC || !encryptionCounter || !CMAC) {
    return [0x80, 0x05, 0x00, 0x00, payload.length, ...payload];
  }
  const blockSize = 16;
  const paddingLength = blockSize - (payload.length % blockSize);
  const paddedPayload = Buffer.concat([
    Buffer.from(payload),
    Buffer.alloc(paddingLength, 0x80),
  ]);
  const iv = aesEcb.encrypt(
    ENC.toString('hex'),
    encryptionCounter.toString('hex'),
  );

  const encryptedPayload = Buffer.from(
    await Aes.encrypt(
      paddedPayload.toString('hex'),
      ENC.toString('hex'),
      iv,
      'aes-128-cbc',
    ),
    'hex',
  );

  const fullApdu = Buffer.from([
    0x84,
    0x05,
    0x00,
    0x00,
    ...encodeLength(encryptedPayload.length),
    ...encryptedPayload,
    ...(encryptedPayload.length > 255 ? [0x00, 0x00] : [0x00]),
  ]);
  const mac = await cmac(CMAC, fullApdu);
  const secureAPDU = Buffer.concat([fullApdu, mac]);

  for (let i = encryptionCounter.length - 1; i >= 0; i--) {
    if (++encryptionCounter[i] !== 0) break;
  }
  return Array.from(secureAPDU);
};
