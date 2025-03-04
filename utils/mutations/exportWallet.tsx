import { useMutation } from "@tanstack/react-query";
import bs58 from "bs58";
import { Alert } from "react-native";
import { CloudStorage } from "react-native-cloud-storage";
import { WalletType } from "../enums";
import { logError } from "../firebase";
import {
  retrieveCloudWalletKeypair,
  retrieveCloudWalletSeedPhrase,
  retrieveDeviceWalletKeypair,
  retrieveDeviceWalletSeedPhrase,
} from "../secure";

export function useExportWallet({
  cloudStorage,
}: {
  cloudStorage: CloudStorage | null;
}) {
  return useMutation({
    mutationKey: ["export-wallet", cloudStorage],
    mutationFn: async ({
      walletType,
      returnMnemonic,
    }: {
      walletType: WalletType;
      returnMnemonic: boolean;
    }) => {
      switch (walletType) {
        case WalletType.DEVICE:
          if (returnMnemonic) {
            return await retrieveDeviceWalletSeedPhrase();
          } else {
            const deviceKeypair = await retrieveDeviceWalletKeypair();
            return bs58.encode(deviceKeypair.secretKey);
          }
        case WalletType.CLOUD:
          if (returnMnemonic) {
            return await retrieveCloudWalletSeedPhrase(cloudStorage);
          } else {
            const deviceKeypair = await retrieveCloudWalletKeypair(
              cloudStorage
            );
            return bs58.encode(deviceKeypair.secretKey);
          }
      }
    },
    onError: (error) => {
      logError(error);
      Alert.alert(
        `Export Wallet failed!`,
        error instanceof Error ? error.message : String(error)
      );
    },
  });
}
