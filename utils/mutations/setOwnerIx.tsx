import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { useMutation } from "@tanstack/react-query";
import { useConnection } from "components/providers/connectionProvider";
import { Alert } from "react-native";
import { SignerType, SignerTypePriority } from "utils/enums/transaction";
import { program } from "utils/program";
import { TransactionSigner } from "utils/types/transaction";
import {
  getFeePayerFromSigners,
  getMultiSigFromAddress,
  getVaultFromAddress,
} from "../helper";
export function useSetOwnerIxMutation({
  wallet,
}: {
  wallet: PublicKey | null | undefined;
}) {
  const { connection } = useConnection();
  return useMutation({
    mutationKey: ["set-owner", { wallet }],
    mutationFn: async ({
      newOwners,
      signers,
    }: {
      newOwners: TransactionSigner[] | null;
      signers: TransactionSigner[];
    }) => {
      if (!wallet) return null;
      try {
        const multisigPda = getMultiSigFromAddress(wallet);
        const vaultPda = getVaultFromAddress(wallet);
        const multisigInfo = await program.account.multiWallet.fetch(
          multisigPda,
          "confirmed"
        );
        const newDeviceOwner = newOwners?.find(
          (x) => x.type === SignerType.DEVICE
        )?.key;
        const newDeviceOwnerPubKey = newDeviceOwner
          ? new PublicKey(
              newOwners?.find((x) => x.type === SignerType.DEVICE)?.key!
            )
          : null;
        const ixs: TransactionInstruction[] = [];

        if (
          newDeviceOwnerPubKey &&
          !(await connection.getAccountInfo(newDeviceOwnerPubKey))?.lamports
        ) {
          ixs.push(
            SystemProgram.transfer({
              fromPubkey: vaultPda,
              toPubkey: newDeviceOwnerPubKey,
              lamports: LAMPORTS_PER_SOL * 0.001,
            })
          );
        }
        ixs.push(
          await program.methods
            .changeConfig(
              multisigInfo.members.filter(
                (x) => x.toString() !== wallet.toString()
              ),
              newOwners
                ?.sort(
                  (a, b) =>
                    SignerTypePriority[a.type] - SignerTypePriority[b.type]
                )
                .map((x) => new PublicKey(x.key)) || null,
              newOwners?.length || 1,
              null
            )
            .accountsPartial({
              multiWallet: multisigPda,
              payer: vaultPda,
            })
            .remainingAccounts(
              signers
                .map((x) => new PublicKey(x.key))
                .map((x) => ({
                  pubkey: x,
                  isSigner: true,
                  isWritable:
                    getFeePayerFromSigners(signers).toString() === x.toString(),
                }))
            )
            .instruction()
        );
        return ixs;
      } catch (error: unknown) {
        Alert.alert(`Transaction failed!`, `${error}`);
        return;
      }
    },
  });
}
