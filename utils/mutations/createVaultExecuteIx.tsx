import {
  AddressLookupTableAccount,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
} from "@solana/web3.js";
import { useMutation } from "@tanstack/react-query";
import { useConnection } from "components/providers/connectionProvider";
import { SignerType } from "utils/enums/transaction";
import { program } from "utils/program";
import {
  getPriorityFeeEstimate,
  getSimulationUnits,
} from "utils/program/transactionBuilder";

import {
  accountsForTransactionExecute,
  transactionMessageSerialize,
  transactionMessageToCompileMessage,
} from "utils/program/utils";
import { vaultTransactionMessageBeet } from "utils/program/utils/VaultTransactionMessage";
import { SignerState, TransactionSigner } from "utils/types/transaction";
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
      signers = [
        { key: wallet!, type: SignerType.NFC, state: SignerState.Unsigned },
      ],
      ixs,
      lookUpTables,
    }: {
      signers?: TransactionSigner[];
      ixs: TransactionInstruction[];
      lookUpTables?: AddressLookupTableAccount[];
    }) => {
      if (!wallet) {
        return;
      }
      const multisigPda = getMultiSigFromAddress(wallet);
      const vaultPda = getVaultFromAddress(wallet);

      const numSigners = new Set<string>();
      ixs.forEach((ix) => {
        ix.keys
          .filter(
            (x) => x.isSigner && x.pubkey.toString() !== vaultPda.toString()
          )
          .forEach((x) => numSigners.add(x.pubkey.toString()));
      });
      signers.forEach((x) => numSigners.add(x.key.toString()));
      const feePayer = getFeePayerFromSigners(signers);

      let [microLamports, units] = await Promise.all([
        getPriorityFeeEstimate(connection, ixs, feePayer, lookUpTables),
        getSimulationUnits(connection, ixs, feePayer, lookUpTables),
      ]);
      microLamports = Math.min(Math.ceil(microLamports), 100_000);
      units = units
        ? Math.max(Math.ceil(units * 2.25), units + 40_000)
        : undefined;

      const totalFees = Math.ceil(
        LAMPORTS_PER_SOL * 0.000005 * numSigners.size +
          (microLamports * (units ? units : 200_000)) / 1_000_000
      );

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
          signers: signers.map((x) => new PublicKey(x.key)),
        });
      const vaultTransactionExecuteIx = await program.methods
        .vaultTransactionExecute(0, transactionMessageBytes)
        .accountsPartial({ multiWallet: multisigPda })
        .remainingAccounts(accountMetas)
        .instruction();
      return {
        vaultTransactionExecuteIx,
        lookupTableAccounts,
        microLamports,
        units,
        totalFees,
      };
    },
  });
}
