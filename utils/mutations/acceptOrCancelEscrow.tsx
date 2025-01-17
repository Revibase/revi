import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { useMutation } from "@tanstack/react-query";
import { useWallets } from "components/hooks/useWallets";
import { Alert } from "react-native";
import { getEscrow, getEscrowNativeVault } from "utils/helper";
import { program } from "utils/program";
import { TransactionSigner } from "utils/types/transaction";
export function useAcceptOrCancelEscrow({
  walletAddress,
}: {
  walletAddress: PublicKey;
}) {
  const { defaultWallet } = useWallets();

  return useMutation({
    mutationKey: ["set-escrow"],
    mutationFn: async ({
      identifier,
      type,
      proposer,
      signers,
    }: {
      identifier: number;
      type: "AcceptAsOwner" | "CancelAsOwner" | "CancelAsProposer";
      proposer: PublicKey;
      signers?: TransactionSigner[];
    }) => {
      if (!walletAddress || !defaultWallet) return null;
      try {
        const escrow = getEscrow(walletAddress, identifier);
        const native_vault = getEscrowNativeVault(walletAddress, identifier);

        let ix: TransactionInstruction;
        if (type === "CancelAsOwner") {
          ix = await program.methods
            .cancelEscrowAsOwner()
            .accountsPartial({
              escrow: escrow,
              proposer: new PublicKey(proposer),
              escrowVault: native_vault,
              escrowTokenVault: null,
              proposerTokenAccount: null,
              mint: null,
              tokenProgram: null,
            })
            .remainingAccounts([
              ...(signers?.map((signer) => ({
                pubkey: new PublicKey(signer.key),
                isSigner: true,
                isWritable: false,
              })) || []),
            ])
            .instruction();
        } else if (type === "CancelAsProposer") {
          ix = await program.methods
            .cancelEscrowAsProposer()
            .accountsPartial({
              escrow: escrow,
              proposer: new PublicKey(proposer),
              escrowVault: native_vault,
              escrowTokenVault: null,
              proposerTokenAccount: null,
              mint: null,
              tokenProgram: null,
            })
            .instruction();
        } else {
          ix = await program.methods
            .executeEscrowAsOwner()
            .accountsPartial({
              escrow: escrow,
              recipient: defaultWallet,
              escrowVault: native_vault,
              escrowTokenVault: null,
              recipientTokenAccount: null,
              mint: null,
              tokenProgram: null,
            })
            .remainingAccounts([
              ...(signers
                ?.filter((x) => x.key.toString() !== defaultWallet.toString())
                .map((signer) => ({
                  pubkey: new PublicKey(signer.key),
                  isSigner: true,
                  isWritable: false,
                })) || []),
            ])
            .instruction();
        }

        return [ix];
      } catch (error: unknown) {
        Alert.alert(`Transaction failed!`, `${error}`);
        return;
      }
    },
  });
}
