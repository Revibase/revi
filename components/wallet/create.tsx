import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { FC } from "react";
import { Button, ButtonText, Heading, YStack } from "tamagui";
import { SignerType } from "utils/enums/transaction";
import { Page } from "utils/enums/wallet";
import { program } from "utils/program";
import { SignerState, TransactionArgs } from "utils/types/transaction";

export const CreateMultisigPage: FC<{
  walletAddress: PublicKey;
  mint?: PublicKey;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  setArgs: React.Dispatch<React.SetStateAction<TransactionArgs | null>>;
}> = ({ walletAddress, mint, setPage, setArgs }) => {
  return (
    <YStack gap={"$8"}>
      <Heading className="text-typography-900">
        {"No multisig wallet detected."}
      </Heading>
      <Button
        onPress={async () => {
          const createWalletIx = await program.methods
            .create(mint?.toString() || null)
            .accounts({
              payer: walletAddress,
              createKey: walletAddress,
            })
            .instruction();
          setArgs({
            signers: [
              {
                key: walletAddress,
                type: SignerType.NFC,
                state: SignerState.Unsigned,
              },
            ],
            ixs: [createWalletIx],
            microLamports: 10_000,
            totalFees:
              (10_000 * 200_000) / 1_000_000 + LAMPORTS_PER_SOL * 0.000005,
          });
          setPage(Page.Confirmation);
        }}
      >
        <ButtonText>Create Wallet</ButtonText>
      </Button>
    </YStack>
  );
};
