import { PublicKey, TransactionSignature } from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConnection } from "components/providers/connectionProvider";
import { Alert } from "react-native";
import { program } from "utils/consts";
import { getMultiSigFromAddress, getVaultFromAddress } from "../helper";
import {
  buildAndSignTransaction,
  pollAndSendTransaction,
  SignerType,
} from "../program/transactionBuilder";
export function useSetOwnerMutation({
  wallet,
}: {
  wallet: PublicKey | null | undefined;
}) {
  const { connection } = useConnection();
  const client = useQueryClient();
  return useMutation({
    mutationKey: ["set-owner", { wallet }],
    mutationFn: async ({
      newOwners,
      signers = [{ address: wallet!, type: SignerType.NFC }],
      feePayer = { address: wallet!, type: SignerType.NFC },
    }: {
      newOwners: PublicKey[] | null;
      signers?: { address: PublicKey; type: SignerType }[];
      feePayer?: { address: PublicKey; type: SignerType };
    }) => {
      if (!wallet) return null;
      let signature: TransactionSignature = "";
      try {
        const multisigPda = getMultiSigFromAddress(wallet);

        const multisigInfo = await program.account.multiWallet.fetch(
          multisigPda
        );

        const changeConfigIx = await program.methods
          .changeConfig(
            multisigInfo.members
              .filter((x) => x.toString() !== wallet.toString())
              .map((x) => new PublicKey(x)),
            newOwners?.map((x) => new PublicKey(x)) || null,
            newOwners?.length || 1
          )
          .accountsPartial({
            multiWallet: new PublicKey(multisigPda),
            payer: new PublicKey(feePayer.address),
          })
          .remainingAccounts(
            signers.map((x) => ({
              pubkey: new PublicKey(x.address),
              isSigner: true,
              isWritable: feePayer.address.toString() === x.address.toString(),
            }))
          )
          .instruction();
        const tx = await buildAndSignTransaction({
          connection,
          feePayer: feePayer.address,
          signers: [
            {
              key: feePayer.address,
              type: feePayer.type,
            },
          ].concat(signers.map((x) => ({ key: x.address, type: x.type }))),
          ixs: [changeConfigIx],
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
