import { useMutation } from "@tanstack/react-query";
import { Alert } from "react-native";
import { CloudStorage } from "react-native-cloud-storage";
import * as Keychain from "react-native-keychain";
import { logError, saveExpoPushToken } from "utils/firebase";
<<<<<<< Updated upstream
import {
  CLOUD_PRIVATE_KEY,
  CLOUD_PUBLIC_KEY,
  CLOUD_SEED_PHRASE,
  DEVICE_PRIVATE_KEY,
  DEVICE_PUBLIC_KEY,
  DEVICE_SEED_PHRASE,
} from "../consts";
import { WalletType } from "../enums";

export function useResetWallet({
  cloudStorage,
=======
import { DEVICE_SEED_PHRASE } from "../consts";
import { WalletType } from "../enums";

export function useResetWallet({
  paymasterWalletPublicKey,
>>>>>>> Stashed changes
  deviceWalletPublicKey,
  cloudWalletPublicKey,
  setCloudWalletPublicKey,
  setDeviceWalletPublicKey,
}: {
<<<<<<< Updated upstream
  cloudStorage: CloudStorage | null;
=======
  paymasterWalletPublicKey: string | null | undefined;
>>>>>>> Stashed changes
  deviceWalletPublicKey: string | null | undefined;
  cloudWalletPublicKey: string | null | undefined;
  setDeviceWalletPublicKey: (
    deviceWalletPublicKey: string | null | undefined
  ) => void;
  setCloudWalletPublicKey: (
    cloudWalletPublicKey: string | null | undefined
  ) => void;
}) {
  return useMutation({
    mutationKey: [
      "reset-wallet",
      paymasterWalletPublicKey,
      deviceWalletPublicKey,
      cloudWalletPublicKey,
      cloudStorage,
      setCloudWalletPublicKey,
      setDeviceWalletPublicKey,
    ],
    mutationFn: async ({ walletType }: { walletType: WalletType }) => {
      switch (walletType) {
        case WalletType.DEVICE:
<<<<<<< Updated upstream
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
        case WalletType.CLOUD:
          if (!cloudStorage || !(await cloudStorage.isCloudAvailable())) {
            throw new Error("Cloudstorage is unavailable");
          }
          await Promise.all([
            cloudStorage.unlink(CLOUD_PUBLIC_KEY),
            cloudStorage.unlink(CLOUD_PRIVATE_KEY),
            cloudStorage.unlink(CLOUD_SEED_PHRASE),
          ]);

=======
          await Keychain.resetGenericPassword({
            service: DEVICE_SEED_PHRASE,
          });
>>>>>>> Stashed changes
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
              await saveExpoPushToken(deviceWalletPublicKey, null, false);
            }
          } catch (error) {
            logError(error);
          } finally {
            setDeviceWalletPublicKey(null);
          }
          break;
        case WalletType.PAYMASTER:
          try {
            if (paymasterWalletPublicKey) {
              await saveExpoPushToken(paymasterWalletPublicKey, null, true);
            }
          } catch (error) {
            logError(error);
          } finally {
            setDeviceWalletPublicKey(null);
          }
          break;
        case WalletType.CLOUD:
          try {
            if (cloudWalletPublicKey) {
              await saveExpoPushToken([cloudWalletPublicKey], null);
            }
          } catch (error) {
            logError(error);
          } finally {
            setCloudWalletPublicKey(null);
          }

          break;
      }
    },
  });
}
