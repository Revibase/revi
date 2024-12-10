import { Keypair } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useCloudStorage } from "components/providers/cloudStorageProvider";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { CloudStorage } from "react-native-cloud-storage";
import { openAppSettings } from "utils/helper";

export function useGetCloudAddress() {
  const { cloudStorage, cloudAvailable } = useCloudStorage();
  return useQuery({
    queryKey: ["get-cloud-address"],
    queryFn: async () => {
      if (cloudAvailable) {
        return (await retrieveCloudKeypair(cloudStorage))?.publicKey || null;
      } else {
        openAppSettings();
        return null;
      }
    },
    staleTime: Infinity,
  });
}

export const retrieveCloudKeypair = async (cloudStorage: CloudStorage) => {
  try {
    const privateKey = await cloudStorage.readFile(
      (Platform.OS === "ios"
        ? Constants.expoConfig?.ios?.bundleIdentifier
        : Constants.expoConfig?.android?.package) || ""
    );

    if (privateKey) {
      return Keypair.fromSecretKey(Buffer.from(privateKey, "hex"));
    } else {
      return null;
    }
  } catch (error) {
    console.log("Error retrieving cloud private key:", error);
    return null;
  }
};
