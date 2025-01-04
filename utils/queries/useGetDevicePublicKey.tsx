import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import * as Keychain from "react-native-keychain";
import { APP_IDENTIFIER } from "utils/consts";
import { WalletType } from "utils/enums/wallet";
export function useGetDevicePublicKey() {
  return useQuery({
    queryKey: ["get-publickey", { walletType: WalletType.DEVICE }],
    queryFn: async () => {
      return (await retrieveDeviceWalletKeypair()).publicKey;
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
      service: `${APP_IDENTIFIER}-DEVICE`,
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

export const retrieveDeviceWalletKeypair = async () => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: `${APP_IDENTIFIER}-DEVICE`,
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
