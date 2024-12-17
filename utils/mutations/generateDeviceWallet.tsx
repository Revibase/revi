import { Keypair } from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import * as Keychain from "react-native-keychain";
import { APP_IDENTIFIER } from "utils/consts";
export function useGenerateDeviceWallet() {
  const client = useQueryClient();
  return useMutation({
    mutationKey: ["generate-device-wallet"],
    mutationFn: async () => {
      try {
        const keypair = Keypair.generate();
        await Keychain.setGenericPassword(
          keypair.publicKey.toString(),
          Buffer.from(keypair.secretKey).toString("hex"),
          {
            service: `${APP_IDENTIFIER}-DEVICE`,
            accessControl:
              Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
            accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
            securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
          }
        );
        return true;
      } catch (error: unknown) {
        Alert.alert(`Failed to generate Device wallet!`, `${error}`);
        return false;
      }
    },
    onSuccess: async (result) => {
      if (result) {
        await Promise.all([
          client.invalidateQueries({
            queryKey: ["get-device-address"],
          }),
        ]);
      }
    },
  });
}
