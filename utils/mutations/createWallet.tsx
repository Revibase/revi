import { PublicKey, TransactionSignature } from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConnection } from "components/providers/connectionProvider";
import { Alert } from "react-native";
import { program } from "utils/consts";
import { getMultiSigFromAddress, getVaultFromAddress } from "utils/helper";
import {
  buildAndSignTransaction,
  pollAndSendTransaction,
  SignerType,
} from "../program/transactionBuilder";

export function useCreateWalletMutation({
  wallet,
}: {
  wallet: PublicKey | null | undefined;
}) {
  const { connection } = useConnection();
  const client = useQueryClient();
  return useMutation({
    mutationKey: ["create-wallet", { address: wallet }],
    mutationFn: async () => {
      if (!wallet) return null;
      let signature: TransactionSignature = "";
      try {
        const createWalletIx = await program.methods
          .create()
          .accounts({
            payer: wallet,
            createKey: wallet,
          })
          .instruction();
        const tx = await buildAndSignTransaction({
          connection,
          feePayer: wallet,
          signers: [{ key: wallet, type: SignerType.NFC }],
          ixs: [createWalletIx],
        });
        signature = await pollAndSendTransaction(connection, tx);
        return signature;
      } catch (error: unknown) {
        console.log(error);
        Alert.alert(`Transaction failed!`, `${error}`);
        return;
      }
    },
    onSuccess: async (result) => {
      if (result) {
        await Promise.all([
          client.invalidateQueries({
            queryKey: [
              "get-assets-by-owner",
              {
                address: getVaultFromAddress({ address: wallet! }),
                connection: connection.rpcEndpoint,
              },
            ],
          }),
          client.invalidateQueries({
            queryKey: [
              "get-wallet-info",
              {
                address: getMultiSigFromAddress(wallet!),
                connection: connection.rpcEndpoint,
              },
            ],
          }),
        ]);
      }
    },
  });
}
