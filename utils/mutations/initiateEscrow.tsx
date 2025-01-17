import { BN } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useMutation } from "@tanstack/react-query";
import { useWallets } from "components/hooks/useWallets";
import { useConnection } from "components/providers/connectionProvider";
import { Alert } from "react-native";
import { SignerType } from "utils/enums/transaction";
import { program } from "utils/program";
import { SignerState } from "utils/types/transaction";
import {
  getEscrowNativeVault,
  getLabelFromSignerType,
  getMultiSigFromAddress,
  getRandomU64,
  getSignerTypeFromAddress,
} from "../helper";
export function useInitiateEscrow({
  walletAddress,
}: {
  walletAddress: PublicKey;
}) {
  const { deviceWalletPublicKey, cloudWalletPublicKey, defaultWallet } =
    useWallets();
  const { connection } = useConnection();
  return useMutation({
    mutationKey: ["initiate-escrow", walletAddress],
    mutationFn: async ({ amount }: { amount: string }) => {
      try {
        if (
          !walletAddress ||
          !deviceWalletPublicKey ||
          !cloudWalletPublicKey ||
          !defaultWallet ||
          !amount
        ) {
          return null;
        }
        const signers = [
          {
            key: new PublicKey(defaultWallet),
            type: getSignerTypeFromAddress(
              { pubkey: defaultWallet },
              deviceWalletPublicKey,
              cloudWalletPublicKey
            ),
            state: SignerState.Unsigned,
          },
          {
            key: new PublicKey(walletAddress),
            type: SignerType.NFC,
            state: SignerState.Unsigned,
          },
        ];
        const identifier = getRandomU64();
        const native_vault = getEscrowNativeVault(walletAddress, identifier);
        const newOwners = [
          {
            pubkey: walletAddress,
            label: getLabelFromSignerType(SignerType.NFC),
          },
          {
            pubkey: deviceWalletPublicKey,
            label: getLabelFromSignerType(SignerType.DEVICE),
          },
          {
            pubkey: cloudWalletPublicKey,
            label: getLabelFromSignerType(SignerType.CLOUD),
          },
        ];
        const parsedAmount = Math.round(parseFloat(amount) * LAMPORTS_PER_SOL);
        const payerData = await connection.getAccountInfo(signers[0].key);
        if (parsedAmount < 0.001 * LAMPORTS_PER_SOL) {
          throw new Error("Amount needs to be greater than 0.001 SOL");
        }
        if (
          (payerData?.lamports || 0) <
          parsedAmount + 0.003 * LAMPORTS_PER_SOL
        ) {
          throw new Error("Insufficient SOL in device wallet to pay for fees.");
        }
        const ix = await program.methods
          .initiateEscrowAsNonOwner(
            new BN(identifier),
            newOwners.map((x) => ({ ...x, pubkey: new PublicKey(x.pubkey) })),
            new BN(parsedAmount),
            2
          )
          .accountsPartial({
            member: signers[1].key,
            multiWallet: getMultiSigFromAddress(walletAddress),
            payer: signers[0].key,
            escrowVault: native_vault,
            escrowTokenVault: null,
            payerTokenAccount: null,
            mint: null,
            tokenProgram: null,
          })
          .instruction();

        return { ix, signers };
      } catch (error: unknown) {
        Alert.alert(`Transaction failed!`, `${error}`);
        return;
      }
    },
  });
}
