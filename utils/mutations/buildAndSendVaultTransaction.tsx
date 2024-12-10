import {
  AddressLookupTableAccount,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConnection } from "components/providers/connectionProvider";
import { Alert } from "react-native";
import { getMultiSigFromAddress, getVaultFromAddress } from "../helper";
import {
  buildAndSignTransaction,
  pollAndSendTransaction,
  SignerType,
} from "../program/transactionBuilder";

export function useBuildAndSendVaultTransaction({
  wallet,
}: {
  wallet: PublicKey | null | undefined;
}) {
  const { connection } = useConnection();
  const client = useQueryClient();
  return useMutation({
    mutationKey: ["send-vault-transaction", { wallet }],
    mutationFn: async ({
      feePayer,
      signers = [{ address: wallet!, type: SignerType.NFC }],
      ixs,
      lookUpTables = [],
    }: {
      feePayer: { address: PublicKey; type: SignerType };
      signers?: { address: PublicKey; type: SignerType }[];
      ixs: TransactionInstruction[];
      lookUpTables?: AddressLookupTableAccount[];
    }) => {
      if (!wallet) return null;
      let signature = "";
      try {
        const tx = await buildAndSignTransaction({
          connection,
          feePayer: feePayer.address,
          signers: [
            {
              key: feePayer.address,
              type: feePayer.type,
            },
          ].concat(signers.map((x) => ({ key: x.address, type: x.type }))),
          ixs: ixs,
          lookUpTables,
        });
        signature = await pollAndSendTransaction(connection, tx);
        return signature;
      } catch (error: unknown) {
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
