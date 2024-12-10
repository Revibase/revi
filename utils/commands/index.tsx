import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import NfcManager, { NfcTech } from "react-native-nfc-manager";
import { createAddress } from "utils/apdu/createPublicKey";
import { readDataWithAttestation } from "utils/apdu/readDataWAttestation";
import { ASSET_IDENTIFIER, ATTESTATION_KEY } from "utils/consts";
import { createAsset } from "../apdu/createAsset";
import { selectApplet } from "../apdu/selectApplet";
import { signEd25519 } from "../apdu/signEd25519";
import { BLOCKCHAIN } from "../enums/chain";
import {
  extractAttributes,
  parseSecureObjectPayload,
  toLittleEndian,
  verifyAndExtractParsedAddress,
  verifyEd25519Signature,
} from "../helper";
import { Chain } from "../types/chain";

NfcManager.start();

export async function readSecureElement(blockchain: Chain) {
  try {
    await NfcManager.requestTechnology(NfcTech.IsoDep);
    const select = await NfcManager.sendCommandAPDUIOS(selectApplet);
    if (select.sw1 !== 144) {
      throw Error("Error selecting applet");
    }

    const attestationKeyResponse = await NfcManager.sendCommandAPDUIOS(
      readDataWithAttestation(ATTESTATION_KEY, ATTESTATION_KEY)
    );
    const attestationKeyResponseParsed = parseSecureObjectPayload(
      attestationKeyResponse.response
    );
    const attestationKey = await verifyAndExtractParsedAddress(
      attestationKeyResponseParsed,
      attestationKeyResponseParsed["TAG_1"]
    );
    if (!attestationKey) {
      throw Error("Unable to verify attestation key!");
    }
    const storedAddress = await readStoredPubkey(blockchain, attestationKey);
    const storedAsset = await readStoredAsset(blockchain, attestationKey);

    return {
      walletAddress: new PublicKey(bs58.encode(toLittleEndian(storedAddress))),
      mint: new PublicKey(bs58.encode(storedAsset.slice(1))),
      blockchain: Object.entries(BLOCKCHAIN).find(
        (x) => x[1] == storedAsset[0]
      )?.[1] as BLOCKCHAIN,
    };
  } catch (e) {
    console.log(JSON.stringify(e));
  } finally {
    NfcManager.cancelTechnologyRequest({
      delayMsAndroid: 0,
    });
  }
}

export async function nfcSignTransction(tx: any) {
  try {
    await NfcManager.requestTechnology(NfcTech.IsoDep);
    await NfcManager.sendCommandAPDUIOS(selectApplet);
    const payload = signEd25519(Array.from(tx.message.serialize()));
    const response = await NfcManager.sendCommandAPDUIOS(payload);
    const signature = toLittleEndian(response.response.slice(4));
    return signature;
  } catch (e) {
    console.log(JSON.stringify(e));
  } finally {
    NfcManager.cancelTechnologyRequest({
      delayMsAndroid: 0,
    });
  }
}

// async function establishSession() {
//   let sessionAddress: number[] | null;
//   let attestationKey: number[] | null;
//   let sessionId;
//   let ephermeralKey: ec.KeyPair;

//   const attestationKeyResponse = await NfcManager.sendCommandAPDUIOS(
//     readAddressWithAttestation(ATTESTATION_KEY, ATTESTATION_KEY)
//   );
//   const attestationKeyResponseParsed = parseSecureObjectPayload(
//     attestationKeyResponse.response
//   );
//   attestationKey = await verifyAndExtractParsedAddress(
//     attestationKeyResponseParsed,
//     attestationKeyResponseParsed["TAG_1"]
//   );
//   if (!attestationKey) {
//     throw Error("Unable to verify attestation key!");
//   }

//   const sessionResponse = await NfcManager.sendCommandAPDUIOS(createSession);
//   sessionId = sessionResponse.response.slice(4);
//   if (sessionResponse.sw1 !== 144) {
//     throw Error("Unable to create session");
//   }
//   const readSessionAddressResponse = await NfcManager.sendCommandAPDUIOS(
//     readAddressWithAttestation(AUTHENTICATION_ID, ATTESTATION_KEY)
//   );
//   const readSessionAddressResponseParsed = parseSecureObjectPayload(
//     readSessionAddressResponse.response
//   );
//   sessionAddress = await verifyAndExtractParsedAddress(
//     readSessionAddressResponseParsed,
//     attestationKey
//   );
//   if (!sessionAddress) {
//     throw Error("Unable to verify session key!");
//   }
//   console.log(sessionAddress);

//   ephermeralKey = generateNistP256KeyPair();
//   const apdu = await processSessionApdu(
//     sessionId,
//     await authenticateSession(ephermeralKey)
//   );
//   console.log(
//     "ECKeySessionInternalAuthenticate",
//     Buffer.from(apdu).toString("hex")
//   );
//   const authenticateSessionResponse = await NfcManager.sendCommandAPDUIOS(apdu);
//   console.log(
//     "ECKeySessionInternalAuthenticate Response",
//     Buffer.from(
//       authenticateSessionResponse.response.concat([
//         authenticateSessionResponse.sw1,
//         authenticateSessionResponse.sw2,
//       ])
//     ).toString("hex")
//   );
//   if (authenticateSessionResponse.sw1 !== 144) {
//     throw Error("Unable to authenticate session");
//   }
//   const { masterKey, RMAC, ENC, CMAC } = await deriveSessionKeys(
//     ephermeralKey,
//     sessionAddress,
//     authenticateSessionResponse.response.slice(2, 18)
//   );

//   return {
//     sessionAddress,
//     sessionId,
//     ephermeralKey,
//     masterKey,
//     RMAC,
//     ENC,
//     CMAC,
//   };
// }

async function readStoredPubkey(blockchain: Chain, attestationKey: number[]) {
  let response = await NfcManager.sendCommandAPDUIOS(
    readDataWithAttestation(blockchain.identifier, ATTESTATION_KEY)
  );
  if (response.sw1 !== 144) {
    const createPubKey = await NfcManager.sendCommandAPDUIOS(
      createAddress(blockchain)
    );
    if (createPubKey.sw1 !== 144) {
      throw Error("Error generating ed25519key");
    }
    response = await NfcManager.sendCommandAPDUIOS(
      readDataWithAttestation(blockchain.identifier, ATTESTATION_KEY)
    );
    if (response.sw1 !== 144) {
      throw Error("Error reading ed25519 key");
    }
  }

  const dataParsed = parseSecureObjectPayload(response.response);

  const PublicKey = await verifyAndExtractParsedAddress(
    dataParsed,
    attestationKey
  );

  if (!PublicKey) {
    throw Error("Unable to retrieve Public Key");
  }
  const attributes = extractAttributes(dataParsed["TAG_2"]);
  if (attributes.objectClass !== 1) {
    throw Error("Object is not a valid key");
  }
  if (attributes.origin !== 2) {
    throw Error("Key is not generated from secure element!");
  }
  if (attributes.authenticationIndicator === 2) {
    throw Error("Key should not be an authentication object");
  }
  if (attributes.policy.join("") !== [8, 0, 0, 0, 0, 24, 32, 0, 0].join("")) {
    throw Error("Key policy is not set correctly");
  }

  const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(16)));

  const signatureResponse = await NfcManager.sendCommandAPDUIOS(
    signEd25519(randomBytes)
  );
  const signature = toLittleEndian(signatureResponse.response.slice(4));

  if (verifyEd25519Signature(PublicKey, randomBytes, signature)) {
    throw Error("Unable to verify key's signature");
  }
  return PublicKey;
}

async function readStoredAsset(blockchain: Chain, attestationKey: number[]) {
  let mint = await NfcManager.sendCommandAPDUIOS(
    readDataWithAttestation(ASSET_IDENTIFIER, ATTESTATION_KEY)
  );
  if (mint.sw1 !== 144) {
    const create = await NfcManager.sendCommandAPDUIOS(
      createAsset(
        blockchain,
        Array.from(bs58.decode("So11111111111111111111111111111111111111112"))
      )
    );
    if (create.sw1 !== 144) {
      throw Error("Error creating stored asset");
    }
    mint = await NfcManager.sendCommandAPDUIOS(
      readDataWithAttestation(ASSET_IDENTIFIER, ATTESTATION_KEY)
    );
    if (mint.sw1 !== 144) {
      throw Error("Error reading stored asset");
    }
  }

  const mintParsed = parseSecureObjectPayload(mint.response);

  const mintData = await verifyAndExtractParsedAddress(
    mintParsed,
    attestationKey
  );
  if (!mintData) {
    throw Error("Unable to retrieve stored asset.");
  }

  const attributes = extractAttributes(mintParsed["TAG_2"]);

  if (attributes.policy.join("") !== [8, 0, 0, 0, 0, 0, 32, 0, 0].join("")) {
    throw Error("Asset is set with wrong policy");
  }
  if (mintData[0] !== blockchain.name) {
    throw Error("Incorrect blockchain id");
  }

  return mintData;
}
