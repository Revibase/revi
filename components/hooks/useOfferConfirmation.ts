import { cancelEscrowAsNonOwner } from "@revibase/multi-wallet";
import { PublicKey } from "@solana/web3.js";
import { router } from "expo-router";
import { useCallback } from "react";
import { Alert } from "react-native";
import {
  EscrowActions,
  Offer,
  Page,
  SignerState,
  TransactionSheetArgs,
  WalletType,
  getSignerTypeFromAddress,
  logError,
  useGlobalStore,
} from "utils";
import { useWalletInfo } from "./useWalletInfo";

export const useOfferConfirmation = (offer: Offer | null | undefined) => {
  const {
    setTransactionSheetArgs,
    deviceWalletPublicKey,
    paymasterWalletPublicKey,
    setWalletSheetArgs,
    setPage,
  } = useGlobalStore();
  const { walletInfo } = useWalletInfo({
    walletAddress: offer?.createKey,
    type: WalletType.MULTIWALLET,
  });
  const handleTransaction = useCallback(
    async (action: EscrowActions) => {
      try {
        if (!offer?.proposer) {
          throw new Error("Unable to find proposer.");
        }
        if (!paymasterWalletPublicKey) {
          setWalletSheetArgs(null);
          router.replace("/(tabs)/profile");
          throw new Error("You need to complete your wallet set up first.");
        }
        const identifier = offer.identifier;
        const walletAddress = offer.createKey;

        let args: TransactionSheetArgs | null = null;
        const feePayer = paymasterWalletPublicKey;
        if (action === EscrowActions.CancelEscrowAsNonOwner) {
          const ix = await cancelEscrowAsNonOwner({
            proposer: new PublicKey(offer.proposer),
            identifier,
            walletAddress: new PublicKey(walletAddress),
          });

          args = {
            callback: (signature) => signature && setPage(Page.Main),
            feePayer,
            walletAddress,
            signers: [
              {
                key: offer.proposer,
                state: SignerState.Unsigned,
                type: getSignerTypeFromAddress(
                  { pubkey: offer.proposer, createKey: offer.createKey },
                  deviceWalletPublicKey,
                  paymasterWalletPublicKey
                ),
              },
            ],
            ixs: [ix],
            theme: "accent",
          };
        } else if (
          action === EscrowActions.AcceptEscrowAsOwner ||
          action === EscrowActions.CancelEscrowAsOwner
        ) {
          if (!walletInfo) throw new Error("Unable to get wallet info.");
          args = {
            callback: (signature) => signature && setPage(Page.Main),
            feePayer,
            walletAddress,
            walletInfo,
            escrowConfig: {
              identifier: offer.identifier,
              type: action,
              proposer: offer.proposer,
            },
            theme: "accent",
          };
        }
        if (!args) {
          throw new Error("Unable to parse instruction data.");
        }
        setTransactionSheetArgs(args);
      } catch (error) {
        logError(error);
        Alert.alert(
          "Error",
          error instanceof Error ? error.message : String(error)
        );
      }
    },
    [deviceWalletPublicKey, paymasterWalletPublicKey, offer, walletInfo]
  );
  return { handleTransaction };
};
