import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { useMutation } from "@tanstack/react-query";
import { useGlobalVariables } from "components/providers/globalProvider";
import { Alert } from "react-native";
import { WalletType } from "utils/enums/wallet";
import {
  retrieveCloudWalletKeypair,
  retrieveCloudWalletSeedPhrase,
} from "utils/queries/useGetCloudPublicKey";
import {
  retrieveDeviceWalletKeypair,
  retrieveDeviceWalletSeedPhrase,
} from "utils/queries/useGetDevicePublicKey";

export function useExportWallet() {
  const { cloudStorage } = useGlobalVariables();
  return useMutation({
    mutationKey: ["export-wallet"],
    mutationFn: async ({
      walletType,
      returnMnemonic,
    }: {
      walletType: WalletType;
      returnMnemonic: boolean;
    }) => {
      try {
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
      } catch (error: any) {
        Alert.alert(`Export Wallet failed!`, `${error}`);
        return null;
      }
    },
  });
}
