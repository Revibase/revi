import {
  BlockchainIds,
  SignMessageData,
  createSignMessageText,
} from "@dialectlabs/blinks-react-native";
import { getVaultFromAddress } from "@revibase/multi-wallet";
import {
  ComputeBudgetProgram,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { useConnection } from "components/providers/connectionProvider";
import { useCallback, useMemo } from "react";
import {
  SignerState,
  WalletType,
  getSignerTypeFromWalletType,
<<<<<<< Updated upstream
  getSponsoredFeePayer,
=======
  sigMessageWithDeviceKeypair,
>>>>>>> Stashed changes
  useGlobalStore,
} from "utils";
import { useWalletInfo } from "./useWalletInfo";

export const useGetBlinksAdapter = () => {
  const {
    walletSheetArgs,
    setTransactionSheetArgs,
    deviceWalletPublicKey,
    cloudWalletPublicKey,
  } = useGlobalStore();
  const { walletAddress, type, theme } = walletSheetArgs ?? {};
  const { walletInfo } = useWalletInfo({ walletAddress, type });

  const { connection } = useConnection();
  const signBlinksTx = useCallback(
    async (tx: string): Promise<string> => {
      const parsedTx = VersionedTransaction.deserialize(
        Buffer.from(tx, "base64")
      );
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Transaction signing timed out"));
        }, 60000);
        const callback = (signature?: string) => {
          clearTimeout(timeout);
          if (signature) {
            resolve(signature);
          } else {
            reject(new Error("Transaction signing failed"));
          }
        };
        if (!walletAddress) {
          clearTimeout(timeout);
          reject(new Error("Wallet Address undefined"));
          return;
        }
        if (type === WalletType.MULTIWALLET) {
          if (!walletInfo) {
            clearTimeout(timeout);
            reject(new Error("Wallet Info undefined"));
            return;
          }
          if (parsedTx.message.header.numRequiredSignatures > 1) {
            clearTimeout(timeout);
            reject(new Error("Partial Transactions are not supported."));
            return;
          }
          Promise.all(
            parsedTx.message.addressTableLookups.map(
              async (x) =>
                (await connection.getAddressLookupTable(x.accountKey)).value
            )
          )
            .then((addressLookupTableAccounts) => {
              const decompiledMessage = TransactionMessage.decompile(
                parsedTx.message,
                {
                  addressLookupTableAccounts: addressLookupTableAccounts.filter(
                    (x) => !!x
                  ),
                }
              );
              const ixs = decompiledMessage.instructions.filter(
                (x, index) =>
                  !(
                    x.programId.toString() ===
                      ComputeBudgetProgram.programId.toString() && index < 2
                  )
              );
<<<<<<< Updated upstream
              const feePayer = getSponsoredFeePayer();
=======

>>>>>>> Stashed changes
              ixs.forEach((x) => {
                if (
                  x.keys.some(
                    (x) => x.pubkey.toString() === paymasterWalletPublicKey
                  )
                ) {
                  clearTimeout(timeout);
                  reject(
                    new Error(
                      "Fee payer should not be referenced inside the instruction."
                    )
                  );
                  return;
                }
              });

              setTransactionSheetArgs({
                feePayer: paymasterWalletPublicKey,
                theme,
                walletAddress,
                walletInfo,
                ixs,
                lookUpTables: addressLookupTableAccounts.filter((x) => !!x),
                callback,
              });
            })
            .catch((error) => {
              clearTimeout(timeout);
              reject(error);
            });
        } else {
          setTransactionSheetArgs({
            feePayer: walletAddress,
            theme,
            walletAddress,
            signers: [
              {
                key: walletAddress,
                type: getSignerTypeFromWalletType(type),
                state: SignerState.Unsigned,
              },
            ],
            tx: parsedTx,
            callback,
          });
        }
      });
    },
    [
      type,
      theme,
      connection,
      walletAddress,
      walletInfo,
      deviceWalletPublicKey,
      cloudWalletPublicKey,
    ]
  );

  const adapter = useMemo(() => {
    return {
      connect: async (_context) => {
        return type === WalletType.MULTIWALLET && walletAddress
          ? getVaultFromAddress(new PublicKey(walletAddress)).toString()
          : walletAddress || null;
      },
      signTransaction: async (tx: string, _context) => {
        const signature = await signBlinksTx(tx);
        return {
          signature,
        };
      },
      confirmTransaction: async (_signature, _context) => {
        return;
      },
      signMessage: async (message: string | SignMessageData, _context) => {
        if (type === WalletType.MULTIWALLET) {
          throw new Error("Message Signing is not supported.");
        } else {
          const messageToSign =
            typeof message === "string"
              ? message
              : createSignMessageText(message);
          const signature = await sigMessageWithDeviceKeypair(messageToSign);
          return {
            signature,
          };
        }
      },
      metadata: { supportedBlockchainIds: [BlockchainIds.SOLANA_MAINNET] },
    };
  }, [walletAddress, type, walletInfo, connection]);
  return adapter;
};
