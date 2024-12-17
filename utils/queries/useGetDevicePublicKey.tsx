import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import * as Keychain from "react-native-keychain";
import { APP_IDENTIFIER } from "utils/consts";
export function useGetDeviceAddress() {
  return useQuery({
    queryKey: ["get-device-address"],
    queryFn: async () => {
      return (await retrieveDeviceKeypair()).publicKey;
    },
    staleTime: Infinity,
  });
}

export const signWithDeviceKeypair = async (tx: VersionedTransaction) => {
  const keypair = await retrieveDeviceKeypair();
  tx.sign([keypair]);
};

const retrieveDeviceKeypair = async () => {
  try {
    const credentials = await Keychain.getGenericPassword({
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
      rules: Keychain.SECURITY_RULES.NONE,
      service: `${APP_IDENTIFIER}-DEVICE`,
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
