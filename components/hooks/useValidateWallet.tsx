import AsyncStorage from "@react-native-async-storage/async-storage";
import { PublicKey } from "@solana/web3.js";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";
import { Alert } from "react-native";
import { Page } from "utils/enums/page";
import { SignerType } from "utils/enums/transaction";
import { WalletType } from "utils/enums/wallet";
import { getMultiSigFromAddress } from "utils/helper";
import { useGetWalletInfo } from "utils/queries/useGetWalletInfo";
import { SignerState, TransactionArgs } from "utils/types/transaction";
import { useWallets } from "./useWallets";

export const useValidateWallet = (
  walletAddress: PublicKey,
  type: WalletType,
  setPage?: React.Dispatch<React.SetStateAction<Page>>,
  setArgs?: React.Dispatch<React.SetStateAction<TransactionArgs | null>>,
  closeSheet?: () => void
) => {
  const { data: walletInfo } = useGetWalletInfo({
    address:
      type === WalletType.MULTIWALLET
        ? getMultiSigFromAddress(walletAddress)
        : null,
  });

  const { deviceWalletPublicKey, cloudWalletPublicKey } = useWallets();

  const noOwners = useMemo(
    () =>
      walletInfo &&
      (
        walletInfo?.members.filter(
          (x) => x.pubkey.toString() !== walletAddress.toString()
        ) || []
      ).length === 0,
    [walletInfo, walletAddress]
  );

  const isMember = useCallback(
    (publicKey?: PublicKey | null) => {
      if (!publicKey || noOwners) return false;
      return (
        walletInfo?.members?.some(
          (x) => x.pubkey.toString() === publicKey.toString()
        ) || walletAddress.toString() === publicKey.toString()
      );
    },
    [walletInfo, walletAddress, noOwners]
  );

  const deviceWalletPublicKeyIsMember = useMemo(
    () => isMember(deviceWalletPublicKey),
    [isMember, deviceWalletPublicKey]
  );

  const cloudWalletPublicKeyIsMember = useMemo(
    () => isMember(cloudWalletPublicKey),
    [isMember, cloudWalletPublicKey]
  );

  const validateAction = useCallback(() => {
    if (
      !noOwners &&
      !deviceWalletPublicKeyIsMember &&
      !cloudWalletPublicKeyIsMember
    ) {
      Alert.alert(
        "Unauthorised action",
        "You are not the owner of this wallet."
      );
      return false;
    } else if (walletInfo && walletInfo.pendingOffers.length > 0) {
      Alert.alert(
        "Wallet locked",
        "Wallet is locked as there are pending offers."
      );
      return false;
    }
    return true;
  }, [
    noOwners,
    deviceWalletPublicKeyIsMember,
    cloudWalletPublicKeyIsMember,
    walletInfo,
  ]);

  const handleSetOwner = useCallback(async () => {
    if (!setPage || !setArgs || !closeSheet) return;
    if (!deviceWalletPublicKey || !cloudWalletPublicKey) {
      closeSheet();
      Alert.alert(
        "Wallet not found.",
        "You need to complete your wallet set up first."
      );
      router.replace("/(tabs)/profile");
      return;
    }
    if (noOwners && walletInfo) {
      setArgs({
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
      setPage(Page.Confirmation);
    }
  }, [
    walletAddress,
    noOwners,
    walletInfo,
    deviceWalletPublicKey,
    cloudWalletPublicKey,
    setPage,
    setArgs,
    closeSheet,
  ]);

  const checkOwnerPrompt = useCallback(async () => {
    if (!walletInfo) return;
    const canceled = await AsyncStorage.getItem(
      `ownerPromptCanceled_${walletAddress}`
    );
    if (noOwners && !canceled) {
      Alert.alert(
        "No owners found.",
        "Would you like to designate yourself as the owner?",
        [
          {
            text: "Cancel",
            onPress: () =>
              AsyncStorage.setItem(
                `ownerPromptCanceled_${walletAddress}`,
                "true"
              ),
          },
          {
            text: "OK",
            onPress: handleSetOwner,
          },
        ]
      );
    }
  }, [noOwners, handleSetOwner, walletAddress, walletInfo]);

  const checkIsLocked = useCallback(async () => {
    if (
      (deviceWalletPublicKeyIsMember || cloudWalletPublicKeyIsMember) &&
      walletInfo &&
      walletInfo?.pendingOffers.length > 0
    ) {
      Alert.alert(
        "Wallet is locked as there are pending offers.",
        "Would you like to view those offer?",
        [
          {
            text: "Cancel",
          },
          {
            text: "OK",
            onPress: () => {
              closeSheet?.();
              router.replace("/offers");
            },
          },
        ]
      );
    }
  }, [
    deviceWalletPublicKeyIsMember,
    cloudWalletPublicKeyIsMember,
    walletInfo,
    closeSheet,
  ]);

  useEffect(() => {
    checkOwnerPrompt();
    checkIsLocked();
  }, [checkOwnerPrompt, checkIsLocked]);

  return {
    noOwners,
    deviceWalletPublicKeyIsMember,
    cloudWalletPublicKeyIsMember,
    validateAction,
  };
};
