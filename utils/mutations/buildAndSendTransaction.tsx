import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConnection } from "components/providers/connectionProvider";
import { useGlobalVariables } from "components/providers/globalProvider";

import { SignerType } from "utils/enums/transaction";
import { signWithCloudKeypair } from "utils/queries/useGetCloudPublicKey";
import { signWithDeviceKeypair } from "utils/queries/useGetDevicePublicKey";
import { SignerState, TransactionSigner } from "utils/types/transaction";
import NfcProxy from "../apdu/index";
import {
  getFeePayerFromSigners,
  getMultiSigFromAddress,
  getVaultFromAddress,
} from "../helper";
import { pollAndSendTransaction } from "../program/transactionBuilder";

export function useBuildAndSendTransaction({
  wallet,
}: {
  wallet: PublicKey | null | undefined;
}) {
  const { connection } = useConnection();
  const client = useQueryClient();
  const { setNfcSheetVisible } = useGlobalVariables();
  return useMutation({
    mutationKey: ["send-vault-transaction", { wallet }],
    mutationFn: async ({
      signers,
      ixs,
      lookUpTables = [],
      microLamports,
      units,
      callback,
    }: {
      signers: TransactionSigner[];
      ixs: TransactionInstruction[];
      lookUpTables?: AddressLookupTableAccount[];
      microLamports?: number;
      units?: number;
      callback: (signer: TransactionSigner) => void;
    }) => {
      if (!wallet) return null;
      let signature = "";
      try {
        const seenKeys = new Set();
        const sortedSingers = signers
          .filter((signer) => {
            if (seenKeys.has(signer.key)) {
              return false;
            }
            seenKeys.add(signer.key);
            return true;
          })
          .sort((a, _) => (a.type == SignerType.NFC ? -1 : 1));

        if (microLamports) {
          ixs.unshift(
            ComputeBudgetProgram.setComputeUnitPrice({
              microLamports: microLamports,
            })
          );
          console.log("Priority Fees: ", microLamports);
        }

        if (units) {
          ixs.unshift(
            ComputeBudgetProgram.setComputeUnitLimit({
              units: units,
            })
          );
          console.log("Compute Units: ", units);
        }

        const tx = new VersionedTransaction(
          new TransactionMessage({
            instructions: ixs,
            recentBlockhash: (
              await connection.getLatestBlockhash({ commitment: "processed" })
            ).blockhash,
            payerKey: getFeePayerFromSigners(signers),
          }).compileToV0Message(lookUpTables)
        );
        for (const signer of sortedSingers) {
          await signTx(signer, tx, callback, setNfcSheetVisible);
        }
        signature = await pollAndSendTransaction(connection, tx);
        return signature;
      } catch (error: any) {
        throw new Error(`${error}`);
      }
    },
    onSuccess: async (result) => {
      if (result && wallet) {
        await Promise.all([
          client.invalidateQueries({
            queryKey: [
              "get-assets-by-owner",
              {
                address: getVaultFromAddress(wallet).toString(),
              },
            ],
          }),
          client.invalidateQueries({
            queryKey: [
              "get-wallet-info",
              {
                address: getMultiSigFromAddress(wallet).toString(),
              },
            ],
          }),
          client.invalidateQueries({
            queryKey: [
              "get-multisig-by-owner",
              {
                address: getMultiSigFromAddress(wallet).toString(),
              },
            ],
          }),
        ]);
      }
    },
  });
}

async function signTx(
  signer: TransactionSigner,
  tx: VersionedTransaction,
  callback: (signer: TransactionSigner) => void,
  callback2: React.Dispatch<React.SetStateAction<boolean>>
) {
  try {
    switch (signer.type) {
      case SignerType.NFC:
        const signature = await NfcProxy.signWithNfcKeypair(tx, callback2);
        tx.addSignature(signer.key, new Uint8Array(signature));
        callback({
          key: signer.key,
          type: signer.type,
          state: SignerState.Signed,
        });
        break;
      case SignerType.DEVICE:
        await signWithDeviceKeypair(tx);
        callback({
          key: signer.key,
          type: signer.type,
          state: SignerState.Signed,
        });
        break;
      case SignerType.CLOUD:
        await signWithCloudKeypair(tx);
        callback({
          key: signer.key,
          type: signer.type,
          state: SignerState.Signed,
        });
        break;
      default:
        break;
    }
  } catch (error) {
    callback({
      key: signer.key,
      type: signer.type,
      state: SignerState.Error,
    });
    throw new Error(`${error.message}`);
  }
}
