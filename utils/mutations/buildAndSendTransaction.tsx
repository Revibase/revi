import {
  AddressLookupTableAccount,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallets } from "components/hooks/useWallets";
import { useConnection } from "components/providers/connectionProvider";
import { useGlobalVariables } from "components/providers/globalProvider";
import { Platform } from "react-native";
import { CloudStorage } from "react-native-cloud-storage";
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
  const { cloudStorage, setNfcSheetVisible } = useGlobalVariables();
  const { deviceWalletPublicKey, cloudWalletPublicKey } = useWallets();
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
          try {
            await signTx(signer, tx, setNfcSheetVisible, cloudStorage);
            callback({
              key: signer.key,
              type: signer.type,
              state: SignerState.Signed,
            });
          } catch (error) {
            callback({
              key: signer.key,
              type: signer.type,
              state: SignerState.Error,
            });
            throw new Error(`${error.message}`);
          }
        }
        signature = await pollAndSendTransaction(connection, tx);
        return signature;
      } catch (error: any) {
        throw new Error(`${error.message}`);
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
                deviceWalletPublicKey,
                cloudWalletPublicKey,
              },
            ],
          }),
          client.invalidateQueries({
            queryKey: [
              "get-your-offers",
              {
                deviceWalletPublicKey,
                cloudWalletPublicKey,
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
  setNfcSheetVisible: React.Dispatch<React.SetStateAction<boolean>>,
  cloudStorage: CloudStorage | null
) {
  try {
    switch (signer.type) {
      case SignerType.NFC:
        try {
          if (Platform.OS === "android") {
            setNfcSheetVisible(true);
          }
          const nfcSignature = await NfcProxy.signRawPayload(
            tx.message.serialize()
          );
          tx.addSignature(signer.key, new Uint8Array(nfcSignature));
        } catch (error) {
          throw new Error(`${error.message}`);
        } finally {
          if (Platform.OS === "android") {
            setNfcSheetVisible(false);
          }
        }
        break;
      case SignerType.DEVICE:
        await signWithDeviceKeypair(tx);
        break;
      case SignerType.CLOUD:
        await signWithCloudKeypair(tx, cloudStorage);
        break;
      default:
        throw new Error("Signer type is unknown.");
    }
  } catch (error) {
    throw new Error(`${error.message}`);
  }
}
