import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import * as Keychain from "react-native-keychain";
import { APP_IDENTIFIER } from "utils/consts";
export function useGetPrimaryAddress() {
  return useQuery({
    queryKey: ["get-primary-address"],
    queryFn: async () => {
      return (await retrievePrimaryKeypair()).publicKey;
    },
    staleTime: Infinity,
  });
}

export const signWithPrimaryKeypair = async (tx: VersionedTransaction) => {
  const keypair = await retrievePrimaryKeypair();
  tx.sign([keypair]);
};

export const retrievePrimarySeedPhrase = async () => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: `${APP_IDENTIFIER}-PRIMARY`,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
    });
    if (credentials) {
      return credentials.username;
    } else {
      throw new Error("No seed phrase found.");
    }
  } catch (error) {
    throw new Error(`${error.message}`);
  }
};

export const retrievePrimaryKeypair = async () => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: `${APP_IDENTIFIER}-PRIMARY`,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
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
