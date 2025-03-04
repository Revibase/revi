import { signAsync } from "@noble/ed25519";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
<<<<<<< Updated upstream
import * as LocalAuthentication from "expo-local-authentication";
import { CloudStorage } from "react-native-cloud-storage";
import * as Keychain from "react-native-keychain";
import {
  CLOUD_PRIVATE_KEY,
  CLOUD_PUBLIC_KEY,
  CLOUD_SEED_PHRASE,
  DEVICE_PRIVATE_KEY,
  DEVICE_PUBLIC_KEY,
  DEVICE_SEED_PHRASE,
} from "../consts";
=======
import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import * as Keychain from "react-native-keychain";
import { DEVICE_SEED_PHRASE } from "../consts";
>>>>>>> Stashed changes

export const getCloudWalletPublicKey = async (
  cloudStorage: CloudStorage | null
) => {
  if (!cloudStorage || !(await cloudStorage.isCloudAvailable())) {
    throw new Error("Cloudstorage is unavailable");
  }
  const address = await cloudStorage.readFile(CLOUD_PUBLIC_KEY);
  return address;
};

export const signWithCloudKeypair = async (
  txs: VersionedTransaction[],
  cloudStorage: CloudStorage | null
) => {
  const keypair = await retrieveCloudWalletKeypair(cloudStorage);
  for (const tx of txs) {
    tx.sign([keypair]);
  }
};

export const retrieveCloudWalletSeedPhrase = async (
  cloudStorage: CloudStorage | null
) => {
  if (!cloudStorage || !(await cloudStorage.isCloudAvailable())) {
    throw new Error("Cloudstorage is unavailable");
  }
  if ((await LocalAuthentication.authenticateAsync()).success) {
    const seedPhrase = await cloudStorage.readFile(CLOUD_SEED_PHRASE);
    return seedPhrase;
  } else {
    throw new Error("Authentication failed");
  }
};

export const retrieveCloudWalletKeypair = async (
  cloudStorage: CloudStorage | null
) => {
  if (!cloudStorage || !(await cloudStorage.isCloudAvailable())) {
    throw new Error("Cloudstorage is unavailable");
  }
  if ((await LocalAuthentication.authenticateAsync()).success) {
    const privateKey = await cloudStorage.readFile(CLOUD_PRIVATE_KEY);
    return Keypair.fromSecretKey(Buffer.from(privateKey, "hex"));
  } else {
    throw new Error("Authentication failed");
  }
};

export const getDeviceWalletPublicKey = async () => {
<<<<<<< Updated upstream
  const credentials = await Keychain.getGenericPassword({
    service: DEVICE_PUBLIC_KEY,
  });
  if (credentials) {
    return credentials.password;
  } else {
    throw new Error("No Public Key found.");
=======
  try {
    const keypair = await retrieveDeviceWalletKeypair();
    const publicKey = keypair.publicKey.toString();
    return publicKey;
  } catch (error) {
    return null;
>>>>>>> Stashed changes
  }
};

export const signWithDeviceKeypair = async (txs: VersionedTransaction[]) => {
  const keypair = await retrieveDeviceWalletKeypair();
  for (const tx of txs) {
    tx.sign([keypair]);
  }
};

export const sigMessageWithDeviceKeypair = async (text: string) => {
  const keypair = await retrieveDeviceWalletKeypair();
  const signature = await signAsync(
    Buffer.from(text, "hex"),
    keypair.secretKey.subarray(0, 32)
  );
  return Buffer.from(signature).toString("base64");
};

export const retrieveDeviceWalletSeedPhrase = async () => {
  const credentials = await Keychain.getGenericPassword({
    service: DEVICE_SEED_PHRASE,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
    authenticationPrompt: { title: "Authenticate", cancel: "Cancel" },
  });
  if (credentials) {
    return credentials.password;
  } else {
    throw new Error("No seed phrase found.");
  }
};

export const retrieveDeviceWalletKeypair = async () => {
<<<<<<< Updated upstream
  const credentials = await Keychain.getGenericPassword({
    service: DEVICE_PRIVATE_KEY,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
    authenticationPrompt: { title: "Authenticate", cancel: "Cancel" },
  });
  if (credentials) {
    return Keypair.fromSecretKey(Buffer.from(credentials.password, "hex"));
  } else {
    throw new Error("No keypair found.");
=======
  try {
    const seedPhrase = await retrieveDeviceWalletSeedPhrase();
    const encoder = new TextEncoder();
    let seedBuffer: Uint8Array | null = encoder.encode(seedPhrase);
    const keypair = await getKeypairFromMnemonic(seedBuffer);
    seedBuffer.fill(0);
    seedBuffer = null;
    return keypair;
  } catch (error) {
    throw new Error(error.message);
>>>>>>> Stashed changes
  }
};

export async function getKeypairFromMnemonic(
  mnemonicBuffer?: Uint8Array | null,
  create = false
) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  if (create) {
    const mnemonic = mnemonicBuffer
      ? decoder.decode(mnemonicBuffer)
      : bip39.generateMnemonic();
    await Keychain.setGenericPassword("Seed Phrase", mnemonic, {
      service: DEVICE_SEED_PHRASE,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
      authenticationPrompt: {
        title: "Authenticate",
        cancel: "Cancel",
      },
    });
    mnemonicBuffer = mnemonicBuffer ? mnemonicBuffer : encoder.encode(mnemonic);
  }
  if (!mnemonicBuffer) {
    throw new Error("No Seed Phrase found.");
  }
  const seed = await bip39.mnemonicToSeed(decoder.decode(mnemonicBuffer));

  mnemonicBuffer.fill(0);
  mnemonicBuffer = null;

  const path = "m/44'/501'/0'/0'";
  const derivedSeed = derivePath(path, seed.toString("hex")).key;
  const keypair = Keypair.fromSeed(derivedSeed);

  seed.fill(0);
  derivedSeed.fill(0);

  return keypair;
}
