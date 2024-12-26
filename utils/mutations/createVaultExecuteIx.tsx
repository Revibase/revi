import {
  AddressLookupTableAccount,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
} from "@solana/web3.js";
import { useMutation } from "@tanstack/react-query";
import { useConnection } from "components/providers/connectionProvider";
import { program } from "utils/program";

import {
  accountsForTransactionExecute,
  transactionMessageSerialize,
  transactionMessageToCompileMessage,
} from "utils/program/utils";
import { vaultTransactionMessageBeet } from "utils/program/utils/VaultTransactionMessage";
import { TransactionSigner } from "utils/types/transaction";
import {
  getFeePayerFromSigners,
  getMultiSigFromAddress,
  getVaultFromAddress,
} from "../helper";

export function useCreateVaultExecuteIxMutation({
  wallet,
}: {
  wallet: PublicKey | null | undefined;
}) {
  const { connection } = useConnection();
  return useMutation({
    mutationKey: ["create-vault-execute-ix", { wallet }],
    mutationFn: async ({
      signers,
      ixs,
      lookUpTables,
      totalFees,
    }: {
      totalFees: number;
      signers: TransactionSigner[];
      ixs: TransactionInstruction[];
      lookUpTables?: AddressLookupTableAccount[];
    }) => {
      if (!wallet) {
        return;
      }
      const multisigPda = getMultiSigFromAddress(wallet);
      const vaultPda = getVaultFromAddress(wallet);
      const feePayer = getFeePayerFromSigners(signers);
      ixs.unshift(
        SystemProgram.transfer({
          fromPubkey: vaultPda,
          toPubkey: feePayer,
          lamports: totalFees,
        })
      );
      const transactionMessageTx = new TransactionMessage({
        payerKey: feePayer,
        recentBlockhash: PublicKey.default.toString(),
        instructions: ixs,
      });

      const compiledMessage = transactionMessageToCompileMessage({
        message: transactionMessageTx,
        addressLookupTableAccounts: lookUpTables,
      });
      const transactionMessageBytes =
        transactionMessageSerialize(compiledMessage);

      const { accountMetas, lookupTableAccounts } =
        await accountsForTransactionExecute({
          connection: connection,
          message: compiledMessage,
          vaultMessage: vaultTransactionMessageBeet.deserialize(
            transactionMessageBytes
          )[0],
          vaultPda: vaultPda,
          signers: signers.map((x) => x.key),
        });
      const vaultTransactionExecuteIx = await program.methods
        .vaultTransactionExecute(0, transactionMessageBytes)
        .accountsPartial({ multiWallet: multisigPda })
        .remainingAccounts(accountMetas)
        .instruction();
      return {
        ixs: vaultTransactionExecuteIx,
        lookUpTables: lookupTableAccounts,
      };
    },
  });
}
