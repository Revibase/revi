import { PublicKey } from "@solana/web3.js";
import { useMutation } from "@tanstack/react-query";
import { Alert } from "react-native";
import { program } from "utils/program";

export function useCreateWalletMutation({
  wallet,
}: {
  wallet: PublicKey | null | undefined;
}) {
  return useMutation({
    mutationKey: ["create-wallet", { address: wallet }],
    mutationFn: async () => {
      if (!wallet) return null;
      try {
        const createWalletIx = await program.methods
          .create()
          .accounts({
            payer: wallet,
            createKey: wallet,
          })
          .instruction();

        return createWalletIx;
      } catch (error: unknown) {
        console.log(error);
        Alert.alert(`Transaction failed!`, `${error}`);
        return;
      }
    },
  });
}
