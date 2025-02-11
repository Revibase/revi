import { getVaultFromAddress } from "@revibase/multi-wallet";
import {
  AddressLookupTableAccount,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConnection } from "components/providers/connectionProvider";
import { Platform } from "react-native";
import { CloudStorage } from "react-native-cloud-storage";
import { WalletType } from "utils/enums";
import { SignerType } from "../enums/transaction";
import { logError, signTransactionsWithPayer } from "../firebase";
import { nfcCore } from "../nfcCore";
import { signWithCloudKeypair, signWithDeviceKeypair } from "../secure";
import {
  pollAndSendJitoBundle,
  pollAndSendTransaction,
} from "../transactionBuilder";
import { SignerState, TransactionSigner } from "../types";

export function useBuildAndSendTransaction({
  walletAddress,
  cloudStorage,
  setIsNfcSheetVisible,
  type = WalletType.MULTIWALLET,
}: {
  walletAddress: string | null | undefined;
  cloudStorage: CloudStorage | null;
  setIsNfcSheetVisible: (value: boolean) => void;
  type?: WalletType;
}) {
  const { connection } = useConnection();
  const client = useQueryClient();
  return useMutation({
    mutationKey: ["send-vault-transaction", { walletAddress }],
    mutationFn: async ({
      feePayer,
      data,
      callback,
    }: {
      feePayer: string;
      data: {
        id: string;
        signers: TransactionSigner[];
        ixs?: TransactionInstruction[];
        tx?: VersionedTransaction;
        lookUpTables?: AddressLookupTableAccount[];
      }[];
      callback: (signer: TransactionSigner & { id: string }) => void;
    }) => {
      let signature = "";
      try {
        let txs: {
          transaction: VersionedTransaction;
          id: string;
          signers: TransactionSigner[];
        }[] = [];
        for (const payload of data) {
          let transaction = payload.tx;
          if (payload.ixs) {
            transaction = new VersionedTransaction(
              new TransactionMessage({
                instructions: payload.ixs,
                recentBlockhash: (
                  await connection.getLatestBlockhash({
                    commitment: "confirmed",
                  })
                ).blockhash,
                payerKey: new PublicKey(feePayer),
              }).compileToV0Message(payload.lookUpTables)
            );
          }
          if (!transaction) {
            throw new Error("Transaction is undefined");
          }
          txs.push({ transaction, id: payload.id, signers: payload.signers });
        }

        const signedTxs = await signTransactions(
          feePayer,
          txs,
          setIsNfcSheetVisible,
          cloudStorage,
          callback
        );

        if (signedTxs.length === 1) {
          signature = await pollAndSendTransaction(
            connection,
            signedTxs[0].transaction
          );
        } else {
          signature = await pollAndSendJitoBundle(
            signedTxs.map((x) =>
              Buffer.from(x.transaction.serialize()).toString("base64")
            )
          );
        }
        return signature;
      } catch (error) {
        logError(error);
        throw new Error(error instanceof Error ? error.message : String(error));
      }
    },
    onSuccess: async (signature) => {
      if (signature && walletAddress) {
        await Promise.all([
          client.invalidateQueries({
            queryKey: [
              "get-assets-by-owner",
              {
                connection: connection.rpcEndpoint,
                address:
                  type === WalletType.MULTIWALLET
                    ? getVaultFromAddress(
                        new PublicKey(walletAddress)
                      ).toString()
                    : walletAddress,
              },
            ],
          }),
        ]);
      }
    },
  });
}

async function signTransactions(
  feePayer: string,
  txs: {
    transaction: VersionedTransaction;
    id: string;
    signers: TransactionSigner[];
  }[],
  setNfcSheetVisible: (value: boolean) => void,
  cloudStorage: CloudStorage | null,
  callback: (signer: TransactionSigner & { id: string }) => void
) {
  const transactionMap = new Map<string, VersionedTransaction>();
  const transactionsToSign = txs.filter(
    (tx) => !tx.signers.some((signer) => signer.key === feePayer)
  );

  if (transactionsToSign.length > 0) {
    const serializedTransactions = transactionsToSign.map((tx) =>
      Buffer.from(tx.transaction.serialize()).toString("base64")
    );

    const signedTxs = await signTransactionsWithPayer(
      serializedTransactions,
      feePayer
    );

    transactionsToSign.forEach((tx, index) => {
      tx.transaction = VersionedTransaction.deserialize(
        Buffer.from(signedTxs[index], "base64")
      );
    });
  }
  txs.forEach((tx) => transactionMap.set(tx.id, tx.transaction));

  const groupedTxs: Record<
    SignerType,
    {
      transaction: VersionedTransaction;
      id: string;
      signer: TransactionSigner;
    }[]
  > = {
    [SignerType.UNKNOWN]: [],
    [SignerType.NFC]: [],
    [SignerType.DEVICE]: [],
    [SignerType.CLOUD]: [],
  };

  for (const tx of txs) {
    for (const signer of tx.signers) {
      if (signer.type === SignerType.UNKNOWN) {
        throw new Error(`Unknown signer type: ${signer.key}`);
      }
      groupedTxs[signer.type].push({
        signer,
        transaction: tx.transaction,
        id: tx.id,
      });
    }
  }

  // Sort to ensure SignerType.NFC is processed last
  const sortedGroupedTxs = Object.entries(groupedTxs).sort(
    ([typeA], [typeB]) => {
      if (typeA === SignerType.NFC) return 1; // Move NFC to the end
      if (typeB === SignerType.NFC) return -1;
      return 0;
    }
  );

  for (const [type, txGroup] of sortedGroupedTxs) {
    if (txGroup.length > 0 && type !== SignerType.UNKNOWN) {
      try {
        if (type === SignerType.DEVICE) {
          await signWithDeviceKeypair(txGroup.map((x) => x.transaction));
        } else if (type === SignerType.CLOUD) {
          await signWithCloudKeypair(
            txGroup.map((x) => x.transaction),
            cloudStorage
          );
        } else if (type === SignerType.NFC) {
          if (Platform.OS === "android") setNfcSheetVisible(true);
          const signatures = await nfcCore.signRawPayloads(
            txGroup
              .map((x) => x.transaction)
              .map((transaction) => transaction.message.serialize())
          );
          txGroup.map((x, index) =>
            x.transaction.addSignature(
              new PublicKey(x.signer.key),
              new Uint8Array(signatures[index])
            )
          );
          if (Platform.OS === "android") setNfcSheetVisible(false);
        }
        txGroup.forEach(({ id, signer }) => {
          callback({
            id,
            ...signer,
            state: SignerState.Signed,
          });
        });
      } catch (error) {
        txGroup.forEach(({ id, signer }) => {
          callback({
            id,
            ...signer,
            state: SignerState.Error,
          });
        });
        logError(error);
        throw new Error(error.message);
      }
    }
  }

  return Array.from(transactionMap.entries()).map(([id, transaction]) => {
    if (!transaction.signatures.length) {
      throw new Error(`Transaction with id ${id} is not signed.`);
    }
    return { id, transaction };
  });
}
