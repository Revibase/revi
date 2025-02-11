import { Keypair, VersionedTransaction } from "@solana/web3.js";
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
  const credentials = await Keychain.getGenericPassword({
    service: DEVICE_PUBLIC_KEY,
  });
  if (credentials) {
    return credentials.password;
  } else {
    throw new Error("No Public Key found.");
  }
};

export const signWithDeviceKeypair = async (txs: VersionedTransaction[]) => {
  const keypair = await retrieveDeviceWalletKeypair();

  for (const tx of txs) {
    tx.sign([keypair]);
  }
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
  const credentials = await Keychain.getGenericPassword({
    service: DEVICE_PRIVATE_KEY,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
    authenticationPrompt: { title: "Authenticate", cancel: "Cancel" },
  });
  if (credentials) {
    return Keypair.fromSecretKey(Buffer.from(credentials.password, "hex"));
  } else {
    throw new Error("No keypair found.");
  }
};
