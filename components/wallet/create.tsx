import { PublicKey } from "@solana/web3.js";
import { router } from "expo-router";
import { FC } from "react";
import { Button, ButtonText, Heading, Spinner, YStack } from "tamagui";
import { useCreateWalletMutation } from "utils/mutations/createWallet";

export const CreateMultisigPage: FC<{
  walletAddress?: PublicKey;
  deviceAddress?: PublicKey;
  cloudAddress?: PublicKey;
}> = ({ walletAddress, deviceAddress, cloudAddress }) => {
  const createWalletMutation = useCreateWalletMutation({
    wallet: walletAddress,
  });

  return (
    <YStack gap={"$8"}>
      <Heading className="text-typography-900">
        {"No multisig wallet detected."}
      </Heading>
      <Button
        disabled={createWalletMutation.isPending}
        onPress={async () => {
          if (deviceAddress && cloudAddress) {
            createWalletMutation.mutateAsync();
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
