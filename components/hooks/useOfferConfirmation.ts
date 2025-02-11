import {
  cancelEscrowAsNonOwner,
  fetchMultiWalletData,
} from "@revibase/multi-wallet";
import { PublicKey } from "@solana/web3.js";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { Alert } from "react-native";
import {
  EscrowActions,
  Offer,
  Page,
  SignerState,
  TransactionSheetArgs,
  getSignerTypeFromAddress,
  getSponsoredFeePayer,
  logError,
  useGlobalStore,
} from "utils";

export const useOfferConfirmation = () => {
  const {
    setTransactionSheetArgs,
    deviceWalletPublicKey,
    cloudWalletPublicKey,
    setPage,
  } = useGlobalStore();
  const queryClient = useQueryClient();
  const handleTransaction = useCallback(
    async (offer: Offer, action: EscrowActions) => {
      try {
        if (!offer?.proposer) {
          throw new Error("Unable to fetch escrow data.");
        }
        const identifier = offer.identifier;
        const walletAddress = offer.createKey;

        let args: TransactionSheetArgs | null = null;
        const feePayer = getSponsoredFeePayer();
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
                  cloudWalletPublicKey
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
          const walletInfo = await fetchMultiWalletData(
            new PublicKey(walletAddress)
          );
          if (!walletInfo) throw new Error("Unable to get wallet info.");
          args = {
            callback: (signature) => signature && setPage(Page.Main),
            feePayer,
            walletAddress,
            walletInfo: {
              ...walletInfo,
              createKey: walletInfo.createKey.toString(),
              members: walletInfo.members.map((x) => ({
                ...x,
                pubkey: x.pubkey.toString(),
              })),
              metadata: walletInfo.metadata?.toString() || null,
            },
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
    [deviceWalletPublicKey, cloudWalletPublicKey]
  );
  return { handleTransaction };
};
