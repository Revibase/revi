import {
  acceptEscrowAsOwner,
  cancelEscrowAsOwner,
  changeConfig,
  createTransactionBundle,
  getVaultFromAddress,
} from "@revibase/multi-wallet";
import {
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { useConnection } from "components/providers/connectionProvider";
import { useCallback } from "react";
import {
  EscrowActions,
  estimateFees,
  estimateJitoTips,
  getMainWalletFromSigners,
  logError,
  SignerState,
  SignerType,
  TransactionResult,
  TransactionSheetArgs,
  useGlobalStore,
} from "utils";

export const useTransactionConfirmation = () => {
  const { connection } = useConnection();
  const { defaultWallet } = useGlobalStore();

  const handleMultiWalletEscrowTransaction = useCallback(
    async ({
      escrowConfig,
      signers,
      feePayer,
      walletAddress,
    }: Partial<TransactionSheetArgs>) => {
      if (!signers || !walletAddress || !feePayer || !escrowConfig) {
        throw new Error("One or more arguments is missing.");
      }

      const mainSigner = getMainWalletFromSigners(signers, defaultWallet);
      let ixs: TransactionInstruction[] = [];

      if (escrowConfig.type === EscrowActions.AcceptEscrowAsOwner) {
        ixs.push(
          await acceptEscrowAsOwner({
            recipient: new PublicKey(mainSigner.key),
            feePayer: new PublicKey(feePayer),
            signers: signers.map((x) => new PublicKey(x.key)),
            identifier: escrowConfig.identifier,
            walletAddress: new PublicKey(walletAddress),
          })
        );
      } else if (escrowConfig.type === EscrowActions.CancelEscrowAsOwner) {
        ixs.push(
          await cancelEscrowAsOwner({
            rentCollector: new PublicKey(mainSigner.key),
            signers: signers.map((x) => new PublicKey(x.key)),
            identifier: escrowConfig.identifier,
            walletAddress: new PublicKey(walletAddress),
          })
        );
      }

      if (ixs.length !== 1) throw new Error("No instructions found.");

      const { microLamports, units, totalFees } = await estimateFees(
        connection,
        ixs,
        feePayer,
        signers
      );

      if (microLamports)
        ixs.unshift(
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports })
        );
      if (units)
        ixs.unshift(ComputeBudgetProgram.setComputeUnitLimit({ units }));

      return {
        feePayer,
        data: [
          {
            id: escrowConfig.type,
            feePayer,
            signers: signers.some((x) => x.key === feePayer)
              ? signers
              : [
                  ...signers,
                  {
                    key: feePayer,
                    state: SignerState.Unsigned,
                    type: SignerType.PAYMASTER,
                  },
                ],
            ixs,
          },
        ],
        totalFees: signers.some((x) => x.key === feePayer) ? totalFees : 0,
      } as TransactionResult;
    },
    [connection, defaultWallet]
  );

  const handleMultiWalletChangeConfigTransaction = useCallback(
    async ({
      changeConfig: changeConfigData,
      signers,
      feePayer,
      walletAddress,
    }: Partial<TransactionSheetArgs>) => {
      if (!signers || !walletAddress || !feePayer || !changeConfigData) {
        throw new Error("One or more arguments is missing.");
      }
      let ixs: TransactionInstruction[] = [];

      ixs.push(
        await changeConfig({
          signers: signers.map((x) => new PublicKey(x.key)),
          walletAddress: new PublicKey(walletAddress),
          feePayer: new PublicKey(feePayer),
          configActions: changeConfigData,
        })
      );

      if (ixs.length !== 1) throw new Error("No instructions found.");

      const { microLamports, units, totalFees } = await estimateFees(
        connection,
        ixs,
        feePayer,
        signers
      );

      if (microLamports)
        ixs.unshift(
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports })
        );
      if (units)
        ixs.unshift(ComputeBudgetProgram.setComputeUnitLimit({ units }));

      return {
        feePayer,
        data: [
          {
            id: "Change Config",
            feePayer,
            signers: signers.some((x) => x.key === feePayer)
              ? signers
              : [
                  ...signers,
                  {
                    key: feePayer,
                    state: SignerState.Unsigned,
                    type: SignerType.PAYMASTER,
                  },
                ],
            ixs,
          },
        ],
        totalFees: signers.some((x) => x.key === feePayer) ? totalFees : 0,
      } as TransactionResult;
    },
    [connection, defaultWallet]
  );

  const handleMultiWalletGenericTransaction = useCallback(
    async ({
      ixs,
      feePayer,
      signers,
      walletAddress,
      lookUpTables,
    }: Partial<TransactionSheetArgs>) => {
      try {
        if (!ixs || !signers || !feePayer || !walletAddress) {
          throw new Error("One or more arguments is missing.");
        }
        const mainSigner = getMainWalletFromSigners(signers, defaultWallet);
        const tipAmount = await estimateJitoTips();
        const instructions = [...ixs];
        instructions.unshift(
          SystemProgram.transfer({
            fromPubkey: getVaultFromAddress(new PublicKey(walletAddress)),
            toPubkey: new PublicKey(feePayer),
            lamports: tipAmount,
          })
        );

        const { result } = await createTransactionBundle({
          feePayer: new PublicKey(feePayer),
          instructions,
          walletAddress: new PublicKey(walletAddress),
          creator: new PublicKey(mainSigner.key),
          signers: signers.map((x) => new PublicKey(x.key)),
          lookUpTables,
          tipAmount,
        });

        return {
          feePayer,
          data: result.map((x) => {
            const finalSigners = x.signers.length > 1 ? signers : [mainSigner];
            return {
              ...x,
              feePayer,
              lookUpTables: x.lookupTableAccounts,
              signers: finalSigners.some((x) => x.key === feePayer)
                ? finalSigners
                : [
                    ...signers,
                    {
                      key: feePayer,
                      state: SignerState.Unsigned,
                      type: SignerType.PAYMASTER,
                    },
                  ],
            };
          }),
          totalFees: tipAmount,
        } as TransactionResult;
      } catch (error) {
        logError(error);
        throw new Error(error instanceof Error ? error.message : String(error));
      }
    },
    [defaultWallet]
  );

  const handleNonMultiWalletTransaction = useCallback(
    async ({
      ixs,
      lookUpTables,
      feePayer,
      signers,
    }: Partial<TransactionSheetArgs>) => {
      try {
        if (!ixs || !feePayer || !signers) {
          throw new Error("One or more arguments is missing");
        }
        const { microLamports, units, totalFees } = await estimateFees(
          connection,
          ixs,
          feePayer,
          signers,
          lookUpTables
        );
        if (microLamports) {
          ixs.unshift(
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports })
          );
        }
        if (units) {
          ixs.unshift(ComputeBudgetProgram.setComputeUnitLimit({ units }));
        }
        return {
          feePayer,
          data: [
            {
              id: "Execute Transaction",
              signers: signers.some((x) => x.key === feePayer)
                ? signers
                : [
                    ...signers,
                    {
                      key: feePayer,
                      state: SignerState.Unsigned,
                      type: SignerType.PAYMASTER,
                    },
                  ],
              feePayer,
              ixs,
              lookUpTables,
            },
          ],
          totalFees: signers.some((x) => x.key === feePayer) ? totalFees : 0,
        } as TransactionResult;
      } catch (error) {
        logError(error);
        throw new Error(error instanceof Error ? error.message : String(error));
      }
    },
    [connection]
  );
  return {
    handleNonMultiWalletTransaction,
    handleMultiWalletGenericTransaction,
    handleMultiWalletChangeConfigTransaction,
    handleMultiWalletEscrowTransaction,
  };
};
