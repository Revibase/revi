import { Keypair, VersionedTransaction } from "@solana/web3.js";
import * as Keychain from "react-native-keychain";
import {
  DEVICE_PRIVATE_KEY,
  DEVICE_PUBLIC_KEY,
  DEVICE_SEED_PHRASE,
} from "../consts";

export const getDeviceWalletPublicKey = async () => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: DEVICE_PUBLIC_KEY,
    });
    if (credentials) {
      return credentials.password;
    } else {
      throw new Error("No Public Key found.");
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

export const signWithDeviceKeypair = async (txs: VersionedTransaction[]) => {
  const keypair = await retrieveDeviceWalletKeypair();

  for (const tx of txs) {
    tx.sign([keypair]);
  }
};

export const retrieveDeviceWalletSeedPhrase = async () => {
  try {
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
  } catch (error) {
    throw new Error(error.message);
  }
};

export const retrieveDeviceWalletKeypair = async () => {
  try {
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
  } catch (error) {
    throw new Error(error.message);
  }
};
