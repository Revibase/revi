import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { useMutation } from "@tanstack/react-query";
import { useConnection } from "components/providers/connectionProvider";
import { Alert } from "react-native";
import { program } from "utils/program";
import { TransactionSigner } from "utils/types/transaction";
import {
  getFeePayerFromSigners,
  getLabelFromSignerType,
  getMultiSigFromAddress,
  getVaultFromAddress,
} from "../helper";
export function useSetOwner({
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
      newOwners: TransactionSigner[];
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

        const ixs: TransactionInstruction[] = [];
        await Promise.all(
          newOwners.map(async (x) => {
            try {
              const accountInfo = await connection.getAccountInfo(
                x.key,
                "confirmed"
              );

              if (!accountInfo) {
                ixs.push(
                  SystemProgram.transfer({
                    fromPubkey: vaultPda,
                    toPubkey: new PublicKey(x.key),
                    lamports: LAMPORTS_PER_SOL * 0.001,
                  })
                );
              }
            } catch (e) {
              console.log(e);
            }
          })
        );
        ixs.push(
          await program.methods
            .changeConfig([
              {
                removeMembers: [multisigInfo.members.map((x) => x.pubkey)],
              },
              {
                addMembers: [
                  newOwners.map((x) => ({
                    pubkey: new PublicKey(x.key),
                    label: getLabelFromSignerType(x.type),
                  })),
                ],
              },
              { setThreshold: [newOwners.length > 1 ? 2 : 1] },
            ])
            .accountsPartial({
              multiWallet: multisigPda,
              payer: vaultPda,
            })
            .remainingAccounts(
              signers.map((x) => ({
                pubkey: x.key,
                isSigner: true,
                isWritable:
                  getFeePayerFromSigners(signers).toString() ===
                  x.key.toString(),
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
