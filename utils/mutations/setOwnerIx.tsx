import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { useMutation } from "@tanstack/react-query";
import { useConnection } from "components/providers/connectionProvider";
import { Alert } from "react-native";
import { SignerType } from "utils/enums/transaction";
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
        newOwners =
          newOwners?.filter((x) => x.toString() !== wallet.toString()) || null;
        const ixs: TransactionInstruction[] = [];

        await Promise.all(
          (newOwners || []).map(async (x) => {
            const accountInfo = await connection.getAccountInfo(x.key);
            if (!accountInfo) {
              ixs.push(
                SystemProgram.transfer({
                  fromPubkey: vaultPda,
                  toPubkey: x.key,
                  lamports: LAMPORTS_PER_SOL * 0.001,
                })
              );
            }
            return Promise.resolve();
          })
        );
        const enumOrder = Object.values(SignerType);
        ixs.push(
          await program.methods
            .changeConfig(
              multisigInfo.members.filter(
                (x) => x.toString() !== wallet.toString()
              ),
              newOwners
                ?.sort((a, b) => {
                  const indexA = enumOrder.indexOf(a.type);
                  const indexB = enumOrder.indexOf(b.type);
                  return indexA - indexB;
                })
                .map((x) => x.key) || null,
              (newOwners?.length || 0) > 1 ? 2 : 1,
              null
            )
            .accountsPartial({
              multiWallet: multisigPda,
              payer: vaultPda,
            })
            .remainingAccounts(
              signers.map((x) => ({
                pubkey: x.key,
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
