import { Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import * as LocalAuthentication from "expo-local-authentication";
import { CloudStorage } from "react-native-cloud-storage";
import {
  CLOUD_PRIVATE_KEY,
  CLOUD_PUBLIC_KEY,
  CLOUD_SEED_PHRASE,
} from "utils/consts";
import { WalletType } from "utils/enums/wallet";

export function useGetCloudPublicKey({
  cloudStorage,
}: {
  cloudStorage: CloudStorage | null;
}) {
  return useQuery({
    queryKey: ["get-publickey", { walletType: WalletType.CLOUD, cloudStorage }],
    queryFn: async () => {
      try {
        if (!cloudStorage || !(await cloudStorage.isCloudAvailable())) {
          throw new Error("Cloudstorage is unavailable");
        }
        const publickey = await cloudStorage.readFile(CLOUD_PUBLIC_KEY);
        return new PublicKey(publickey);
      } catch (e) {
        return null;
      }
    },
    staleTime: Infinity,
  });
}

export const signWithCloudKeypair = async (
  tx: VersionedTransaction,
  cloudStorage: CloudStorage | null
) => {
  if (!cloudStorage || !(await cloudStorage.isCloudAvailable())) {
    throw new Error("Cloudstorage is unavailable");
  }
  const keypair = await retrieveCloudWalletKeypair(cloudStorage);
  tx.sign([keypair]);
};

export const retrieveCloudWalletSeedPhrase = async (
  cloudStorage: CloudStorage | null
) => {
  try {
    if (!cloudStorage || !(await cloudStorage.isCloudAvailable())) {
      throw new Error("Cloudstorage is unavailable");
    }
    if ((await LocalAuthentication.authenticateAsync()).success) {
      const seedPhrase = await cloudStorage.readFile(CLOUD_SEED_PHRASE);
      return seedPhrase;
    } else {
      throw new Error("Authentication failed");
    }
  } catch (error) {
    throw new Error(`${error.message}`);
  }
};

export const retrieveCloudWalletKeypair = async (
  cloudStorage: CloudStorage | null
) => {
  try {
    if (!cloudStorage || !(await cloudStorage.isCloudAvailable())) {
      throw new Error("Cloudstorage is unavailable");
    }
    if ((await LocalAuthentication.authenticateAsync()).success) {
      const privateKey = await cloudStorage.readFile(CLOUD_PRIVATE_KEY);
      return Keypair.fromSecretKey(Buffer.from(privateKey, "hex"));
    } else {
      throw new Error("Authentication failed");
    }
  } catch (error) {
    throw new Error(`${error.message}`);
  }
};
