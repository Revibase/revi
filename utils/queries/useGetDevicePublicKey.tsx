import { Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import * as Keychain from "react-native-keychain";
import {
  DEVICE_PRIVATE_KEY,
  DEVICE_PUBLIC_KEY,
  DEVICE_SEED_PHRASE,
} from "utils/consts";
import { WalletType } from "utils/enums/wallet";
export function useGetDevicePublicKey() {
  return useQuery({
    queryKey: ["get-publickey", { walletType: WalletType.DEVICE }],
    queryFn: async () => {
      try {
        const credentials = await Keychain.getGenericPassword({
          service: DEVICE_PUBLIC_KEY,
        });
        if (credentials) {
          return new PublicKey(credentials.password);
        } else {
          throw new Error("No key found.");
        }
      } catch (e) {
        return null;
      }
    },
    staleTime: Infinity,
  });
}

export const signWithDeviceKeypair = async (tx: VersionedTransaction) => {
  const keypair = await retrieveDeviceWalletKeypair();
  tx.sign([keypair]);
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
    throw new Error(`${error.message}`);
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
      throw new Error("No key found.");
    }
  } catch (error) {
    throw new Error(`${error.message}`);
  }
};
