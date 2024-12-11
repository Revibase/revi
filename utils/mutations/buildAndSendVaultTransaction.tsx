import { PublicKey } from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCloudStorage } from "components/providers/cloudStorageProvider";
import { useConnection } from "components/providers/connectionProvider";
import { Alert } from "react-native";
import { Signer, TransactionArgs } from "utils/types/transaction";
import { getMultiSigFromAddress, getVaultFromAddress } from "../helper";
import {
  buildAndSignTransaction,
  pollAndSendTransaction,
} from "../program/transactionBuilder";

export function useBuildAndSendVaultTransaction({
  wallet,
}: {
  wallet: PublicKey | null | undefined;
}) {
  const { connection } = useConnection();
  const { cloudStorage } = useCloudStorage();
  const client = useQueryClient();
  return useMutation({
    mutationKey: ["send-vault-transaction", { wallet }],
    mutationFn: async ({
      args,
      callback,
    }: {
      args: TransactionArgs;
      callback: (signer: Signer) => void;
    }) => {
      if (!wallet) return null;
      let signature = "";
      try {
        const tx = await buildAndSignTransaction({
          connection,
          args,
          callback,
          cloudStorage,
        });
        signature = await pollAndSendTransaction(connection, tx);
        return signature;
      } catch (error: unknown) {
        Alert.alert(`Transaction failed!`, `${error}`);
        return;
      }
    },
    onSuccess: async (result) => {
      if (result && wallet) {
        await Promise.all([
          client.invalidateQueries({
            queryKey: [
              "get-assets-by-owner",
              {
                address: getVaultFromAddress({
                  address: wallet,
                }),
                connection: connection.rpcEndpoint,
              },
            ],
          }),
          client.invalidateQueries({
            queryKey: [
              "get-wallet-info",
              {
                address: getMultiSigFromAddress(wallet),
                connection: connection.rpcEndpoint,
              },
            ],
          }),
        ]);
      }
    },
  });
}
