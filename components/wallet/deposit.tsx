import { PublicKey } from "@solana/web3.js";
import { Copy } from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { useCopyToClipboard } from "components/hooks/useCopyToClipboard";
import { FC } from "react";
import { ButtonIcon, ButtonText, Text, YStack } from "tamagui";
import { Page } from "utils/enums/page";
import { Header } from "./header";

export const Deposit: FC<{
  walletAddress: PublicKey;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
}> = ({ walletAddress, setPage }) => {
  const copyToClipboard = useCopyToClipboard();
  return (
    <YStack
      enterStyle={{ opacity: 0, x: -25 }}
      animation={"quick"}
      gap={"$8"}
      padding={"$4"}
      alignItems="center"
    >
      <Header text={"Deposit"} reset={() => setPage(Page.Main)} />
      <Text textAlign="center" fontSize={"$5"}>
        Send assets to the wallet address below
      </Text>
      <Text fontSize={"$5"} textAlign="center" width={"80%"}>
        {walletAddress.toString()}
      </Text>
      <CustomButton onPress={() => copyToClipboard(walletAddress.toString())}>
        <ButtonText>Copy</ButtonText>
        <ButtonIcon children={<Copy />}></ButtonIcon>
      </CustomButton>
      <Text fontSize={"$5"} textAlign="center">
        This address can only receive assets on Solana.
      </Text>
    </YStack>
  );
};
