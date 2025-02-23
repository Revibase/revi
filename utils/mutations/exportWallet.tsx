import { useMutation } from "@tanstack/react-query";
import bs58 from "bs58";
import { Alert } from "react-native";
import { logError } from "utils/firebase";
import { WalletType } from "../enums";
import {
  retrieveDeviceWalletKeypair,
  retrieveDeviceWalletSeedPhrase,
} from "../secure";

export function useExportWallet() {
  return useMutation({
    mutationKey: ["export-wallet"],
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
