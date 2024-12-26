import {
  AddressLookupTableAccount,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConnection } from "components/providers/connectionProvider";
import { useGlobalVariables } from "components/providers/globalProvider";
import { SignerType } from "utils/enums/transaction";
import { signWithPrimaryKeypair } from "utils/queries/useGetPrimaryAddress";
import { signWithSecondaryKeypair } from "utils/queries/useGetSecondaryAddress";
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
  const { setNfcSheetVisible, subOrganizationId } = useGlobalVariables();
  return useMutation({
    mutationKey: ["send-vault-transaction", { wallet }],
    mutationFn: async ({
      signers,
      ixs,
      lookUpTables = [],
      callback,
    }: {
      signers: TransactionSigner[];
      ixs: TransactionInstruction[];
      lookUpTables?: AddressLookupTableAccount[];
      callback: (signer: TransactionSigner) => void;
    }) => {
      let signature = "";
      try {
        const enumOrder = Object.values(SignerType);
        const seenKeys = new Set();
        const sortedSingers = signers
          .filter((signer) => {
            if (seenKeys.has(signer.key)) {
              return false;
            }
            seenKeys.add(signer.key);
            return true;
          })
          .sort((a, b) => {
            const indexA = enumOrder.indexOf(a.type);
            const indexB = enumOrder.indexOf(b.type);
            return indexA - indexB;
          });

        const tx = new VersionedTransaction(
          new TransactionMessage({
            instructions: ixs,
            recentBlockhash: (
              await connection.getLatestBlockhash({ commitment: "confirmed" })
            ).blockhash,
            payerKey: getFeePayerFromSigners(signers),
          }).compileToV0Message(lookUpTables)
        );
        for (const signer of sortedSingers) {
          await signTx(
            signer,
            tx,
            subOrganizationId,
            callback,
            setNfcSheetVisible
          );
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
  subOrganizationId: string | undefined,
  callback: (signer: TransactionSigner) => void,
  callback2: React.Dispatch<React.SetStateAction<boolean>>
) {
  try {
    switch (signer.type) {
      case SignerType.NFC:
        const nfcSignature = await NfcProxy.signWithNfcKeypair(tx, callback2);
        tx.addSignature(signer.key, new Uint8Array(nfcSignature));
        callback({
          key: signer.key,
          type: signer.type,
          state: SignerState.Signed,
        });
        break;
      case SignerType.PRIMARY:
        await signWithPrimaryKeypair(tx);
        callback({
          key: signer.key,
          type: signer.type,
          state: SignerState.Signed,
        });
        break;
      case SignerType.SECONDARY:
        const secondarySignature = await signWithSecondaryKeypair(
          subOrganizationId,
          signer.key,
          tx
        );
        tx.addSignature(signer.key, new Uint8Array(secondarySignature));
        callback({
          key: signer.key,
          type: signer.type,
          state: SignerState.Signed,
        });
        break;
      default:
        throw new Error("Signer type is unknown.");
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
