import { PublicKey } from "@solana/web3.js";
import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import { Alert } from "react-native";
import { ThemeName } from "tamagui";
import {
  getPermissionsFromSignerType,
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
    paymasterWalletPublicKey,
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

  const paymasterWalletPublicKeyIsMember = useMemo(
    () => isMember(paymasterWalletPublicKey),
    [isMember, paymasterWalletPublicKey]
  );

  const handleTakeOverAsOwner = useCallback(() => {
    if (!deviceWalletPublicKey || !paymasterWalletPublicKey) {
      setWalletSheetArgs(null);
      Alert.alert(
        "Wallet not found.",
        "You need to complete your wallet set up first."
      );
      router.replace("/(tabs)/profile");
      return;
    }
    if (noOwners && walletInfo && walletAddress) {
      const feePayer = paymasterWalletPublicKey;
      setTransactionSheetArgs({
        feePayer,
        theme,
        walletAddress,
        changeConfig: [
          {
            type: "setMembers",
            members: [
              {
                pubkey: new PublicKey(walletAddress),
                permissions: getPermissionsFromSignerType(SignerType.NFC),
              },
              {
                pubkey: new PublicKey(deviceWalletPublicKey),
                permissions: getPermissionsFromSignerType(SignerType.DEVICE),
              },
              {
                pubkey: new PublicKey(paymasterWalletPublicKey),
                permissions: getPermissionsFromSignerType(SignerType.PAYMASTER),
              },
            ],
          },
          {
            type: "setThreshold",
            threshold: 2,
          },
        ],
        walletInfo,
      });
    }
  }, [
    theme,
    walletAddress,
    noOwners,
    walletInfo,
    deviceWalletPublicKey,
    paymasterWalletPublicKey,
  ]);

  return {
    isLoading,
    walletInfo,
    noOwners,
    deviceWalletPublicKeyIsMember,
    paymasterWalletPublicKeyIsMember,
    handleTakeOverAsOwner,
  };
};
