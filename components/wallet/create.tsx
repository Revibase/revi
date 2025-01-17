import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Copy } from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { useCopyToClipboard } from "components/hooks/useCopyToClipboard";
import { useConnection } from "components/providers/connectionProvider";
import { FC, useEffect, useState } from "react";
import { ButtonIcon, ButtonText, Heading, Text, YStack } from "tamagui";
import { Page } from "utils/enums/page";
import { SignerType } from "utils/enums/transaction";
import { useCreateWallet } from "utils/mutations/createWallet";
import { SignerState, TransactionArgs } from "utils/types/transaction";

export const CreateMultisigPage: FC<{
  walletAddress: PublicKey;
  mint: PublicKey | null | undefined;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  setArgs: React.Dispatch<React.SetStateAction<TransactionArgs | null>>;
}> = ({ walletAddress, mint, setPage, setArgs }) => {
  const copyToClipboard = useCopyToClipboard();
  const [lamports, setLamports] = useState(0);
  const { connection } = useConnection();
  const createWalletMutation = useCreateWallet({ walletAddress, mint });
  useEffect(() => {
    connection.getAccountInfo(walletAddress).then((resutl) => {
      setLamports(resutl?.lamports || 0);
    });
  }, [connection]);
  return (
    <YStack gap={"$8"} padding={"$4"} alignItems="center">
      <Heading>{"NFC Hardware Wallet"}</Heading>
      <Text textAlign="center" fontSize={"$5"}>
        {
          "No collectible wallet detected. Deposit at least 0.006 SOL to the wallet address below to create your collectible wallet."
        }
      </Text>
      <YStack
        gap={"$4"}
        width={"90%"}
        alignItems="center"
        justifyContent="center"
        padding={"$4"}
        borderWidth={"$1"}
        borderRadius={"$4"}
      >
        <Heading size={"$1"}>Wallet Address (Solana)</Heading>
        <CustomButton onPress={() => copyToClipboard(walletAddress.toString())}>
          <ButtonText>{`${walletAddress.toString()}`}</ButtonText>
          <ButtonIcon children={<Copy />}></ButtonIcon>
        </CustomButton>
        <Heading size={"$1"}>{`Current Balance: ${
          lamports / LAMPORTS_PER_SOL
        } SOL`}</Heading>
      </YStack>
      <YStack gap={"$2"}>
        <CustomButton
          disabled={lamports < LAMPORTS_PER_SOL * 0.006}
          onPress={async () => {
            const ixs = await createWalletMutation.mutateAsync();
            if (ixs) {
              setArgs({
                callback: () => setPage(Page.Create),
                signers: [
                  {
                    key: walletAddress,
                    type: SignerType.NFC,
                    state: SignerState.Unsigned,
                  },
                ],
                ixs,
              });
              setPage(Page.Confirmation);
            }
          }}
        >
          <ButtonText width={"60%"} textAlign="center">
            Create Wallet
          </ButtonText>
        </CustomButton>
        {lamports < LAMPORTS_PER_SOL * 0.006 && (
          <Text color={"red"} textAlign="center" fontSize={"$1"}>
            Require at least 0.006 SOL
          </Text>
        )}
      </YStack>
    </YStack>
  );
};
