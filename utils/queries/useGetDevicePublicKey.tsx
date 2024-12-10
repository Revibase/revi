import { Keypair } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { openAppSettings } from "utils/helper";

export function useGetDeviceAddress() {
  return useQuery({
    queryKey: ["get-device-address"],
    queryFn: async () => {
      if (
        SecureStore.canUseBiometricAuthentication() &&
        (await SecureStore.isAvailableAsync())
      ) {
        return (await retrieveDeviceKeypair())?.publicKey || null;
      } else {
        openAppSettings();
        return null;
      }
    },
    staleTime: Infinity,
  });
}

export const retrieveDeviceKeypair = async () => {
  try {
    const credentials = await SecureStore.getItemAsync(
      (Platform.OS === "ios"
        ? Constants.expoConfig?.ios?.bundleIdentifier
        : Constants.expoConfig?.android?.package) || "",
      {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
        requireAuthentication: true,
        keychainService:
          (Platform.OS === "ios"
            ? Constants.expoConfig?.ios?.bundleIdentifier
            : Constants.expoConfig?.android?.package) || "",
      }
    );
    if (credentials) {
      return Keypair.fromSecretKey(Buffer.from(credentials, "hex"));
    } else {
      return null;
    }
  } catch (error) {
    console.log("Error retrieving device private key:", error);
    return null;
  }
};
