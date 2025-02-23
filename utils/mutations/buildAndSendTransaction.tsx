import { getVaultFromAddress } from "@revibase/multi-wallet";
import {
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConnection } from "components/providers/connectionProvider";
import { Platform } from "react-native";
import { Passkey } from "react-native-passkey";
import { WalletType } from "utils/enums";
import { SignerType } from "../enums/transaction";
import {
  authenticatePasskey,
  generatePasskeyAuthentication,
  logError,
} from "../firebase";
import { nfcCore } from "../nfcCore";
import { signWithDeviceKeypair } from "../secure";
import {
  pollAndSendJitoBundle,
  pollAndSendTransaction,
} from "../transactionBuilder";
import { SignerState, TransactionResult, TransactionSigner } from "../types";

export function useBuildAndSendTransaction({
  walletAddress,
  setIsNfcSheetVisible,
  type = WalletType.MULTIWALLET,
  paymasterWalletPublicKey,
}: {
  walletAddress: string | null | undefined;
  paymasterWalletPublicKey: string | null | undefined;
  setIsNfcSheetVisible: (value: boolean) => void;
  type?: WalletType;
}) {
  const { connection } = useConnection();
  const client = useQueryClient();
  return useMutation({
    mutationKey: [
      "send-vault-transaction",
      { walletAddress, paymasterWalletPublicKey },
    ],
    mutationFn: async ({
      data,
      callback,
    }: TransactionResult & {
      callback: (signer: TransactionSigner & { id: string }) => void;
    }) => {
      const recentBlockhash = (
        await connection.getLatestBlockhash({
          commitment: "confirmed",
        })
      ).blockhash;
      data.forEach((payload) => {
        if (payload.ixs) {
          payload.tx = new VersionedTransaction(
            new TransactionMessage({
              instructions: payload.ixs,
              recentBlockhash,
              payerKey: new PublicKey(payload.feePayer),
            }).compileToV0Message(payload.lookUpTables)
          );
        }
        if (!payload.tx) {
          throw new Error("Transaction is undefined");
        }
      });

      const signedTxs = await signTransactions(
        data,
        setIsNfcSheetVisible,
        callback
      );
      let signature = "";
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
    },
    onError: (error) => {
      logError(error);
      throw new Error(error instanceof Error ? error.message : String(error));
    },
    onSuccess: async (signature) => {
      if (signature && walletAddress && paymasterWalletPublicKey) {
        await Promise.all([
          client.invalidateQueries({
            queryKey: [
              "get-account-info",
              { address: paymasterWalletPublicKey },
            ],
          }),
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
  data: {
    id: string;
    signers: TransactionSigner[];
    feePayer: string;
    tx?: VersionedTransaction;
  }[],
  setNfcSheetVisible: (value: boolean) => void,
  callback: (signer: TransactionSigner & { id: string }) => void
) {
  const transactionMap = new Map<string, VersionedTransaction>();
  data.forEach((x) => transactionMap.set(x.id, x.tx!));
  const groupedTxs: Record<
    SignerType,
    {
      transaction: VersionedTransaction;
      id: string;
      signer: TransactionSigner;
    }[]
  > = {
    [SignerType.UNKNOWN]: [],
    [SignerType.PAYMASTER]: [],
    [SignerType.NFC]: [],
    [SignerType.DEVICE]: [],
  };

  for (const tx of data) {
    for (const signer of tx.signers) {
      if (signer.type === SignerType.UNKNOWN) {
        throw new Error(`Unknown signer type: ${signer.key}`);
      }
      groupedTxs[signer.type].push({
        signer,
        transaction: tx.tx!,
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
        } else if (type === SignerType.NFC) {
          if (Platform.OS === "android") setNfcSheetVisible(true);
          const signatures = await nfcCore.signRawPayloads(
            txGroup
              .map((x) => x.transaction)
              .map((transaction) => transaction.message.serialize())
          );
          txGroup.forEach((x, index) =>
            x.transaction.addSignature(
              new PublicKey(x.signer.key),
              new Uint8Array(signatures[index])
            )
          );
          if (Platform.OS === "android") setNfcSheetVisible(false);
        } else if (type === SignerType.PAYMASTER) {
          const request = await generatePasskeyAuthentication({
            publicKey: txGroup[0].signer.key,
          });
          const response = await Passkey.get(request.options);
          const signatures = (
            await authenticatePasskey({
              requestId: request.requestId,
              response,
              publicKey: txGroup[0].signer.key,
              payload: txGroup
                .map((x) => x.transaction)
                .map((transaction) =>
                  Buffer.from(transaction.message.serialize()).toString(
                    "base64"
                  )
                ),
            })
          ).signatures;
          txGroup.forEach((x, index) =>
            x.transaction.addSignature(
              new PublicKey(x.signer.key),
              new Uint8Array(Buffer.from(signatures[index], "base64"))
            )
          );
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
