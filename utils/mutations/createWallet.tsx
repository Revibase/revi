import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { useMutation } from "@tanstack/react-query";
import { Alert } from "react-native";
import { program } from "utils/program";
import { getVaultFromAddress } from "../helper";
export function useCreateWallet({
  walletAddress,
  mint,
}: {
  walletAddress: PublicKey | null | undefined;
  mint: PublicKey | null | undefined;
}) {
  return useMutation({
    mutationKey: ["create-wallet", { walletAddress }],
    mutationFn: async () => {
      if (!walletAddress) return null;
      try {
        const createWalletIx = await program.methods
          .create(
            {
              pubkey: walletAddress,
              label: 0,
            },
            mint || null
          )
          .accounts({
            payer: walletAddress,
          })
          .instruction();
        const transferSolIx = SystemProgram.transfer({
          fromPubkey: walletAddress,
          toPubkey: getVaultFromAddress(walletAddress),
          lamports: LAMPORTS_PER_SOL * 0.003,
        });
        return [createWalletIx, transferSolIx];
      } catch (error: unknown) {
        Alert.alert(`Transaction failed!`, `${error}`);
        return;
      }
    },
  });
}
