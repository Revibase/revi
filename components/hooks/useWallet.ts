import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import { Alert } from "react-native";
import { ThemeName } from "tamagui";
import {
  getSponsoredFeePayer,
  SignerState,
  SignerType,
  useGlobalStore,
  WalletType,
} from "utils";
import { useWalletInfo } from "./useWalletInfo";
import { useWalletMembership } from "./useWalletMembership";

export const useWallet = ({
  type,
  theme,
  walletAddress,
}: {
  type: WalletType | undefined;
  theme: ThemeName | null | undefined;
  walletAddress: string | null | undefined;
}) => {
  const {
    setWalletSheetArgs,
    setTransactionSheetArgs,
    deviceWalletPublicKey,
    cloudWalletPublicKey,
  } = useGlobalStore();

  const { walletInfo, isLoading } = useWalletInfo({ type, walletAddress });

  const { noOwners, isMember } = useWalletMembership({
    walletInfo,
    walletAddress,
  });

  const deviceWalletPublicKeyIsMember = useMemo(
    () => isMember(deviceWalletPublicKey),
    [isMember, deviceWalletPublicKey]
  );

  const cloudWalletPublicKeyIsMember = useMemo(
    () => isMember(cloudWalletPublicKey),
    [isMember, cloudWalletPublicKey]
  );

  const handleTakeOverAsOwner = useCallback(() => {
    if (!deviceWalletPublicKey || !cloudWalletPublicKey) {
      setWalletSheetArgs(null);
      Alert.alert(
        "Wallet not found.",
        "You need to complete your wallet set up first."
      );
      router.replace("/(tabs)/profile");
      return;
    }
    if (noOwners && walletInfo && walletAddress) {
      const feePayer = getSponsoredFeePayer();
      setTransactionSheetArgs({
        feePayer,
        theme,
        walletAddress,
        changeConfig: {
          newOwners: [
            {
              key: walletAddress,
              type: SignerType.NFC,
              state: SignerState.Unsigned,
            },
            {
              key: deviceWalletPublicKey,
              type: SignerType.DEVICE,
              state: SignerState.Unsigned,
            },
            {
              key: cloudWalletPublicKey,
              type: SignerType.CLOUD,
              state: SignerState.Unsigned,
            },
          ],
        },
        walletInfo,
      });
    }
  }, [
    theme,
    walletAddress,
    noOwners,
    walletInfo,
    deviceWalletPublicKey,
    cloudWalletPublicKey,
  ]);

  return {
    isLoading,
    walletInfo,
    noOwners,
    deviceWalletPublicKeyIsMember,
    cloudWalletPublicKeyIsMember,
    handleTakeOverAsOwner,
  };
};
