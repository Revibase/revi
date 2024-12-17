import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import * as Keychain from "react-native-keychain";
import { APP_IDENTIFIER } from "utils/consts";
export function useGetCloudAddress() {
  return useQuery({
    queryKey: ["get-cloud-address"],
    queryFn: async () => {
      return (await retrieveCloudKeypair()).publicKey;
    },
    staleTime: Infinity,
  });
}

export const signWithCloudKeypair = async (tx: VersionedTransaction) => {
  const keypair = await retrieveCloudKeypair();
  tx.sign([keypair]);
};

const retrieveCloudKeypair = async () => {
  try {
    const credentials = await Keychain.getGenericPassword({
      rules: Keychain.SECURITY_RULES.NONE,
      service: `${APP_IDENTIFIER}-CLOUD`,
      cloudSync: true,
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
