import { DAS } from "@revibase/token-transfer";
import { useCallback } from "react";
import { useGlobalStore, WalletType } from "utils";

export const useAssetValidation = () => {
  const { deviceWalletPublicKey, paymasterWalletPublicKey } = useGlobalStore();
  const hasAsset = useCallback(
    (
      asset: DAS.GetAssetResponse | null | undefined,
      vaultAddress: string | null | undefined,
      noOwners: boolean,
      deviceWalletPublicKeyIsMember: boolean,
      paymasterWalletPublicKeyIsMember: boolean,
      type: WalletType | undefined
    ) => {
      if (!!asset?.token_info?.balance) {
        return true;
      }
      if (!!asset?.ownership?.owner) {
        switch (type) {
          case WalletType.DEVICE:
            return asset.ownership.owner === deviceWalletPublicKey;
          case WalletType.PAYMASTER:
            return asset.ownership.owner === paymasterWalletPublicKey;
          case WalletType.MULTIWALLET:
            return (
              vaultAddress === asset.ownership.owner &&
              (noOwners ||
                deviceWalletPublicKeyIsMember ||
                paymasterWalletPublicKeyIsMember)
            );
        }
      }
      return false;
    },

    [deviceWalletPublicKey, paymasterWalletPublicKey]
  );
  return { hasAsset };
};
