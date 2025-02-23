import {
  acceptEscrowAsOwner,
  cancelEscrowAsOwner,
  changeConfig,
  createTransactionBundle,
} from "@revibase/multi-wallet";
import {
  ComputeBudgetProgram,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { useConnection } from "components/providers/connectionProvider";
import { useCallback } from "react";
import {
  EscrowActions,
  estimateFees,
  estimateJitoTips,
  getTransactionCreatorFromSigners,
  logError,
  SignerState,
  SignerType,
  TransactionResult,
  TransactionSheetArgs,
  TransactionSigner,
  useGlobalStore,
} from "utils";

export const useTransactionConfirmation = () => {
  const { connection } = useConnection();
  const { deviceWalletPublicKey } = useGlobalStore();

  const handleMultiWalletEscrowTransaction = useCallback(
    async ({
      escrowConfig,
      signers,
      feePayer,
      walletAddress,
    }: Partial<TransactionSheetArgs>) => {
      if (
        !signers ||
        !walletAddress ||
        !feePayer ||
        !escrowConfig ||
        !deviceWalletPublicKey
      ) {
        throw new Error("One or more arguments is missing.");
      }

      let ixs: TransactionInstruction[] = [];

      if (escrowConfig.type === EscrowActions.AcceptEscrowAsOwner) {
        ixs.push(
          await acceptEscrowAsOwner({
            recipient: new PublicKey(deviceWalletPublicKey),
            feePayer: new PublicKey(feePayer),
            signers: signers.map((x) => new PublicKey(x.key)),
            identifier: escrowConfig.identifier,
            walletAddress: new PublicKey(walletAddress),
          })
        );
      } else if (escrowConfig.type === EscrowActions.CancelEscrowAsOwner) {
        ixs.push(
          await cancelEscrowAsOwner({
            rentCollector: new PublicKey(deviceWalletPublicKey),
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
            signers: getSignersWithFeePayer(signers, feePayer),
            ixs,
          },
        ],
        totalFees,
      } as TransactionResult;
    },
    [connection, deviceWalletPublicKey]
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
            ixs,
            id: "Change Config",
            feePayer,
            signers: getSignersWithFeePayer(signers, feePayer),
          },
        ],
        totalFees,
      } as TransactionResult;
    },
    [connection]
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
        const creator = getTransactionCreatorFromSigners(signers);
        const tipAmount = await estimateJitoTips();
        const instructions = [...ixs];
        const { result } = await createTransactionBundle({
          feePayer: new PublicKey(feePayer),
          instructions,
          walletAddress: new PublicKey(walletAddress),
          creator: new PublicKey(creator.key),
          signers: signers.map((x) => new PublicKey(x.key)),
          lookUpTables,
          tipAmount,
        });

        return {
          feePayer,
          data: result.map((x) => {
            const finalSigners = x.signers.length > 1 ? signers : [creator];
            return {
              ...x,
              feePayer,
              lookUpTables: x.lookupTableAccounts,
              signers: getSignersWithFeePayer(finalSigners, feePayer),
            };
          }),
          totalFees: tipAmount,
        } as TransactionResult;
      } catch (error) {
        logError(error);
        throw new Error(error instanceof Error ? error.message : String(error));
      }
    },
    []
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
              signers: getSignersWithFeePayer(signers, feePayer),
              feePayer,
              ixs,
              lookUpTables,
            },
          ],
          totalFees,
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
function getSignersWithFeePayer(
  signers: TransactionSigner[],
  feePayer: string
): TransactionSigner[] {
  return signers.some((x) => x.key === feePayer)
    ? signers
    : [
        ...signers,
        {
          key: feePayer,
          state: SignerState.Unsigned,
          type: SignerType.PAYMASTER,
        },
      ];
}
