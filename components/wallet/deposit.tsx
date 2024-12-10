import { PublicKey } from "@solana/web3.js";
import { ArrowLeft, Copy } from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import * as Clipboard from "expo-clipboard";
import { FC } from "react";
import {
  Button,
  ButtonIcon,
  ButtonText,
  Heading,
  Text,
  XStack,
  YStack,
} from "tamagui";
import { Page } from "utils/enums/wallet";
import { getVaultFromAddress } from "utils/helper";

export const Deposit: FC<{
  walletAddress: PublicKey;
  setPage?: React.Dispatch<React.SetStateAction<Page>>;
  isMultiSig?: boolean;
}> = ({ walletAddress, setPage, isMultiSig = true }) => {
  const toast = useToastController();
  const copyToClipboard = async (textToCopy: string) => {
    await Clipboard.setStringAsync(textToCopy);
    toast.show("Copied!");
  };
  return (
    <YStack gap={"$4"} alignItems="center">
      <XStack
        gap={"$4"}
        padding="$2"
        justifyContent="space-between"
        alignItems="center"
        width={"100%"}
      >
        <Button
          circular
          backgroundColor={"$colorTransparent"}
          onPress={() => setPage && setPage(Page.Main)}
          opacity={setPage ? 1 : 0}
        >
          <ArrowLeft size="xl" />
        </Button>
        <Heading>{`Deposit`}</Heading>

        <ArrowLeft size="xl" opacity={0} />
      </XStack>

      <Text textAlign="center" fontSize={"$5"}>
        Send assets to the wallet address below
      </Text>
      <Text fontSize={"$5"} textAlign="center">
        {isMultiSig
          ? getVaultFromAddress({ address: walletAddress }).toString()
          : walletAddress?.toString()}
      </Text>
      <Button
        onPress={() => copyToClipboard(walletAddress.toString())}
        theme="active"
      >
        <ButtonText>Copy</ButtonText>
        <ButtonIcon children={<Copy />}></ButtonIcon>
      </Button>
      <Text color={"$accentColor"} textAlign="center">
        This address can only receive assets on Solana.
      </Text>
    </YStack>
  );
};
