import {
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
} from "@solana/web3.js";
import { useMutation } from "@tanstack/react-query";
import { useConnection } from "components/providers/connectionProvider";
import { Alert } from "react-native";
import { program } from "utils/consts";
import {
  accountsForTransactionExecute,
  transactionMessageToMultisigTransactionMessageBytes,
} from "utils/program/utils";
import { vaultTransactionMessageBeet } from "utils/program/utils/VaultTransactionMessage";
import { getMultiSigFromAddress, getVaultFromAddress } from "../helper";
import { SignerType } from "../program/transactionBuilder";

export function useCreateVaultExecuteIxMutation({
  wallet,
}: {
  wallet: PublicKey | null | undefined;
}) {
  const { connection } = useConnection();
  return useMutation({
    mutationKey: ["create-vault-execute-ix", { wallet }],
    mutationFn: async ({
      feePayer,
      signers = [{ address: wallet!, type: SignerType.NFC }],
      ixs,
    }: {
      feePayer: { address: PublicKey; type: SignerType };
      signers?: { address: PublicKey; type: SignerType }[];
      ixs: TransactionInstruction[];
    }) => {
      if (!wallet) return null;
      try {
        const multisigPda = getMultiSigFromAddress(wallet);
        const vaultPda = getVaultFromAddress({ address: wallet });

        const transactionMessageTx = new TransactionMessage({
          payerKey: feePayer.address,
          recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
          instructions: ixs,
        });

        const transactionMessageBytes =
          transactionMessageToMultisigTransactionMessageBytes({
            message: transactionMessageTx,
          });
        const { accountMetas, lookupTableAccounts } =
          await accountsForTransactionExecute({
            connection: connection,
            message: vaultTransactionMessageBeet.deserialize(
              transactionMessageBytes
            )[0],
            vaultPda: vaultPda,
            signers: signers.map((x) => x.address),
          });

        const vaultTransactionExecuteIx = await program.methods
          .vaultTransactionExecute(0, transactionMessageBytes)
          .accountsPartial({ multiWallet: multisigPda })
          .remainingAccounts(accountMetas)
          .instruction();

        return { vaultTransactionExecuteIx, lookupTableAccounts };
      } catch (error: unknown) {
        Alert.alert(`Transaction failed!`, `${error}`);
        return;
      }
    },
  });
}
