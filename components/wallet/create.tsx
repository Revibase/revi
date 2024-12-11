import { PublicKey } from "@solana/web3.js";
import { useOnboarding } from "components/providers/onboardingProvider";
import { router } from "expo-router";
import { FC } from "react";
import { Button, ButtonText, Heading, Spinner, YStack } from "tamagui";
import { Page } from "utils/enums/wallet";
import { useCreateWalletMutation } from "utils/mutations/createWallet";
import { SignerType } from "utils/program/transactionBuilder";
import { SignerState, TransactionArgs } from "utils/types/transaction";

export const CreateMultisigPage: FC<{
  walletAddress?: PublicKey;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  setArgs: React.Dispatch<React.SetStateAction<TransactionArgs | null>>;
}> = ({ walletAddress, setArgs, setPage }) => {
  const createWalletMutation = useCreateWalletMutation({
    wallet: walletAddress,
  });
  const { deviceAddress, cloudAddress } = useOnboarding();
  return (
    <YStack gap={"$8"}>
      <Heading className="text-typography-900">
        {"No multisig wallet detected."}
      </Heading>
      <Button
        disabled={createWalletMutation.isPending}
        onPress={async () => {
          if (deviceAddress && cloudAddress && walletAddress) {
            const ix = await createWalletMutation.mutateAsync();
            if (ix) {
              setArgs({
                feePayer: {
                  key: walletAddress,
                  type: SignerType.NFC,
                  state: SignerState.Unsigned,
                },
                signers: [
                  {
                    key: walletAddress,
                    type: SignerType.NFC,
                    state: SignerState.Unsigned,
                  },
                ],
                ixs: [ix],
              });
              setPage(Page.Confirmation);
            }
          } else {
            router.replace("/(tabs)/profile");
          }
        }}
        theme="active"
      >
        <ButtonText>Create Wallet</ButtonText>
        {createWalletMutation.isPending && <Spinner />}
      </Button>
    </YStack>
  );
};
