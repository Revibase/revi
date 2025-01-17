import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGlobalVariables } from "components/providers/globalProvider";
import { Alert } from "react-native";
import * as Keychain from "react-native-keychain";
import {
  CLOUD_PRIVATE_KEY,
  CLOUD_PUBLIC_KEY,
  CLOUD_SEED_PHRASE,
  DEVICE_PRIVATE_KEY,
  DEVICE_PUBLIC_KEY,
  DEVICE_SEED_PHRASE,
} from "utils/consts";
import { WalletType } from "utils/enums/wallet";

export function useResetWallet() {
  const { cloudStorage } = useGlobalVariables();
  const client = useQueryClient();
  return useMutation({
    mutationKey: ["reset-wallet"],
    mutationFn: async ({ walletType }: { walletType: WalletType }) => {
      try {
        switch (walletType) {
          case WalletType.DEVICE:
            await Promise.all([
              Keychain.resetGenericPassword({
                service: DEVICE_PUBLIC_KEY,
              }),
              Keychain.resetGenericPassword({
                service: DEVICE_PRIVATE_KEY,
              }),
              Keychain.resetGenericPassword({
                service: DEVICE_SEED_PHRASE,
              }),
            ]);
            await client.invalidateQueries({
              queryKey: ["get-publickey", { walletType }],
            });
            await client.refetchQueries({
              queryKey: ["get-publickey", { walletType }],
            });
            break;
          case WalletType.CLOUD:
            if (!cloudStorage || !(await cloudStorage.isCloudAvailable())) {
              throw new Error("Cloudstorage is unavailable");
            }
            await Promise.all([
              cloudStorage.unlink(CLOUD_PUBLIC_KEY),
              cloudStorage.unlink(CLOUD_PRIVATE_KEY),
              cloudStorage.unlink(CLOUD_SEED_PHRASE),
            ]);
            await client.invalidateQueries({
              queryKey: ["get-publickey", { walletType, cloudStorage }],
            });
            await client.refetchQueries({
              queryKey: ["get-publickey", { walletType, cloudStorage }],
            });
            break;
        }
        return walletType;
      } catch (error: any) {
        Alert.alert(`Remove Wallet failed!`, `${error}`);
        return null;
      }
    },
  });
}
