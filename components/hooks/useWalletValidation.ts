import { useCallback } from "react";
import { Alert } from "react-native";
import { WalletInfo } from "utils";

export const useWalletValidation = ({
  walletInfo,
  noOwners,
  hasPendingOffers,
  deviceWalletPublicKeyIsMember,
  paymasterWalletPublicKeyIsMember,
}: {
  walletInfo: WalletInfo | null | undefined;
  noOwners: boolean;
  hasPendingOffers: boolean;
  deviceWalletPublicKeyIsMember: boolean;
  paymasterWalletPublicKeyIsMember: boolean;
}) => {
  return useCallback(() => {
    if (
      walletInfo &&
      !noOwners &&
      !deviceWalletPublicKeyIsMember &&
      !paymasterWalletPublicKeyIsMember
    ) {
      Alert.alert(
        "Unauthorized action",
        "You are not the owner of this wallet."
      );
      return false;
    } else if (hasPendingOffers) {
      Alert.alert(
        "Wallet locked",
        "Wallet is locked as there are pending offers."
      );
      return false;
    }
    return true;
  }, [
    walletInfo,
    noOwners,
    hasPendingOffers,
    deviceWalletPublicKeyIsMember,
    paymasterWalletPublicKeyIsMember,
  ]);
};
