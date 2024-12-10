import { Keypair } from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Alert, Platform } from "react-native";
import { openAppSettings } from "utils/helper";

export function useGenerateDeviceWallet() {
  const client = useQueryClient();
  return useMutation({
    mutationKey: ["generate-device-wallet"],
    mutationFn: async () => {
      try {
        if (
          SecureStore.canUseBiometricAuthentication() &&
          (await SecureStore.isAvailableAsync())
        ) {
          await SecureStore.setItemAsync(
            (Platform.OS === "ios"
              ? Constants.expoConfig?.ios?.bundleIdentifier
              : Constants.expoConfig?.android?.package) || "",
            Buffer.from(Keypair.generate().secretKey).toString("hex"),
            {
              keychainAccessible: SecureStore.WHEN_UNLOCKED,
              requireAuthentication: true,
              keychainService:
                (Platform.OS === "ios"
                  ? Constants.expoConfig?.ios?.bundleIdentifier
                  : Constants.expoConfig?.android?.package) || "",
            }
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
          queryKey: ["get-device-address"],
        });
      }
    },
  });
}
