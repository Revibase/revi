import { Keypair } from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCloudStorage } from "components/providers/cloudStorageProvider";
import Constants from "expo-constants";
import { Alert, Platform } from "react-native";
import { openAppSettings } from "utils/helper";

export function useGenerateCloudWallet() {
  const client = useQueryClient();
  const { cloudStorage, cloudAvailable } = useCloudStorage();
  return useMutation({
    mutationKey: ["generate-cloud-wallet"],
    mutationFn: async () => {
      try {
        if (cloudAvailable) {
          await cloudStorage.writeFile(
            (Platform.OS === "ios"
              ? Constants.expoConfig?.ios?.bundleIdentifier
              : Constants.expoConfig?.android?.package) || "",
            Buffer.from(Keypair.generate().secretKey).toString("hex")
          );
          return true;
        } else {
          openAppSettings();
          return false;
        }
      } catch (error: unknown) {
        Alert.alert(`Failed to generate Device wallet!`, `${error}`);
        return;
      }
    },
    onSuccess: async (result) => {
      if (result) {
        await client.invalidateQueries({
          queryKey: ["get-cloud-address"],
        });
      }
    },
  });
}
