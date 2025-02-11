import { DAS } from "@revibase/token-transfer";
import { useCallback } from "react";
import { useGlobalStore, WalletType } from "utils";

export const useAssetValidation = () => {
  const { deviceWalletPublicKey, cloudWalletPublicKey } = useGlobalStore();
  const hasAsset = useCallback(
    (
      asset: DAS.GetAssetResponse | null | undefined,
      vaultAddress: string | null | undefined,
      deviceWalletPublicKeyIsMember: boolean,
      cloudWalletPublicKeyIsMember: boolean,
      type: WalletType | undefined
    ) => {
      if (!!asset?.token_info?.balance) {
        return true;
      }
      if (!!asset?.ownership?.owner) {
        switch (type) {
          case WalletType.DEVICE:
            return asset.ownership.owner === deviceWalletPublicKey;
          case WalletType.CLOUD:
            return asset.ownership.owner === cloudWalletPublicKey;
          case WalletType.MULTIWALLET:
            return (
              vaultAddress === asset.ownership.owner &&
              (deviceWalletPublicKeyIsMember || cloudWalletPublicKeyIsMember)
            );
        }
      }
      return false;
    },

    [deviceWalletPublicKey, cloudWalletPublicKey]
  );
  return { hasAsset };
};
