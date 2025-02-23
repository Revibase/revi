import { useMutation } from "@tanstack/react-query";
import { Alert } from "react-native";
import * as Keychain from "react-native-keychain";
import { logError, saveExpoPushToken } from "utils/firebase";
import {
  DEVICE_PRIVATE_KEY,
  DEVICE_PUBLIC_KEY,
  DEVICE_SEED_PHRASE,
} from "../consts";
import { WalletType } from "../enums";

export function useResetWallet({
  deviceWalletPublicKey,
  setPaymasterWalletPublicKey,
  setDeviceWalletPublicKey,
}: {
  deviceWalletPublicKey: string | null | undefined;
  setDeviceWalletPublicKey: (
    deviceWalletPublicKey: string | null | undefined
  ) => void;
  setPaymasterWalletPublicKey: (
    paymasterWalletPublicKey: string | null | undefined
  ) => void;
}) {
  return useMutation({
    mutationKey: [
      "reset-wallet",
      deviceWalletPublicKey,
      setPaymasterWalletPublicKey,
      setDeviceWalletPublicKey,
    ],
    mutationFn: async ({ walletType }: { walletType: WalletType }) => {
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

          break;
        case WalletType.PAYMASTER:
          setPaymasterWalletPublicKey(null);
          break;
      }
      return walletType;
    },
    onError: (error) => {
      logError(error);
      Alert.alert(
        `Remove Wallet failed!`,
        error instanceof Error ? error.message : String(error)
      );
    },
    onSuccess: async (result) => {
      switch (result) {
        case WalletType.DEVICE:
          try {
            if (deviceWalletPublicKey) {
              await saveExpoPushToken([deviceWalletPublicKey], null);
            }
          } catch (error) {
            logError(error);
          } finally {
            setDeviceWalletPublicKey(null);
          }

          break;
      }
    },
  });
}
