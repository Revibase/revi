import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { FC } from "react";
import { Button, ButtonText, Heading, YStack } from "tamagui";
import { SignerType } from "utils/enums/transaction";
import { Page } from "utils/enums/wallet";
import { getVaultFromAddress } from "utils/helper";
import { program } from "utils/program";
import { SignerState, TransactionArgs } from "utils/types/transaction";

export const CreateMultisigPage: FC<{
  walletAddress: PublicKey;
  mint?: PublicKey;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  setArgs: React.Dispatch<React.SetStateAction<TransactionArgs | null>>;
}> = ({ walletAddress, mint, setPage, setArgs }) => {
  return (
    <YStack gap={"$8"} padding={"$4"} alignItems="center">
      <Heading>{"No multisig wallet detected."}</Heading>
      <Button
        onPress={async () => {
          const createWalletIx = await program.methods
            .create(mint?.toString() || null)
            .accounts({
              payer: walletAddress,
              createKey: walletAddress,
            })
            .instruction();
          const transferSolIx = SystemProgram.transfer({
            fromPubkey: walletAddress,
            toPubkey: getVaultFromAddress(walletAddress),
            lamports: LAMPORTS_PER_SOL * 0.003,
          });
          setArgs({
            callback: () => setPage(Page.Create),
            signers: [
              {
                key: walletAddress,
                type: SignerType.NFC,
                state: SignerState.Unsigned,
              },
            ],
            ixs: [createWalletIx, transferSolIx],
          });
          setPage(Page.Confirmation);
        }}
      >
        <ButtonText>Create Wallet</ButtonText>
      </Button>
    </YStack>
  );
};
