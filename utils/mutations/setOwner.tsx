import { PublicKey } from "@solana/web3.js";
import { useMutation } from "@tanstack/react-query";
import { Alert } from "react-native";
import { program } from "utils/program";
import { Signer, SignerState } from "utils/types/transaction";
import { getMultiSigFromAddress } from "../helper";
import { SignerType } from "../program/transactionBuilder";
export function useSetOwnerMutation({
  wallet,
}: {
  wallet: PublicKey | null | undefined;
}) {
  return useMutation({
    mutationKey: ["set-owner", { wallet }],
    mutationFn: async ({
      newOwners,
      signers = [
        { key: wallet!, type: SignerType.NFC, state: SignerState.Unsigned },
      ],
      feePayer = {
        key: wallet!,
        type: SignerType.NFC,
        state: SignerState.Unsigned,
      },
    }: {
      newOwners: PublicKey[] | null;
      signers?: Signer[];
      feePayer?: Signer;
    }) => {
      if (!wallet) return null;
      try {
        const multisigPda = getMultiSigFromAddress(wallet);

        const multisigInfo = await program.account.multiWallet.fetch(
          multisigPda
        );

        const changeConfigIx = await program.methods
          .changeConfig(
            multisigInfo.members
              .filter((x) => x.toString() !== wallet.toString())
              .map((x) => new PublicKey(x)),
            newOwners?.map((x) => new PublicKey(x)) || null,
            newOwners?.length || 1
          )
          .accountsPartial({
            multiWallet: new PublicKey(multisigPda),
            payer: new PublicKey(feePayer.key),
          })
          .remainingAccounts(
            signers.map((x) => ({
              pubkey: new PublicKey(x.key),
              isSigner: true,
              isWritable: feePayer.key.toString() === x.key.toString(),
            }))
          )
          .instruction();
        return changeConfigIx;
      } catch (error: unknown) {
        Alert.alert(`Transaction failed!`, `${error}`);
        return;
      }
    },
  });
}
