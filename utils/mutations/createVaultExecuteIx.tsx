import {
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
} from "@solana/web3.js";
import { useMutation } from "@tanstack/react-query";
import { useConnection } from "components/providers/connectionProvider";
import { Alert } from "react-native";
import { program } from "utils/program";
import {
  accountsForTransactionExecute,
  transactionMessageToMultisigTransactionMessageBytes,
} from "utils/program/utils";
import { vaultTransactionMessageBeet } from "utils/program/utils/VaultTransactionMessage";
import { Signer, SignerState } from "utils/types/transaction";
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
      signers = [
        { key: wallet!, type: SignerType.NFC, state: SignerState.Unsigned },
      ],
      ixs,
    }: {
      feePayer: Signer;
      signers?: Signer[];
      ixs: TransactionInstruction[];
    }) => {
      if (!wallet) return null;
      try {
        const multisigPda = getMultiSigFromAddress(wallet);
        const vaultPda = getVaultFromAddress({ address: wallet });

        const transactionMessageTx = new TransactionMessage({
          payerKey: new PublicKey(feePayer.key),
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
            vaultPda: new PublicKey(vaultPda),
            signers: signers.map((x) => new PublicKey(x.key)),
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
