import { PublicKey } from "@solana/web3.js";
import { ArrowLeft, Copy } from "@tamagui/lucide-icons";
import { useCopyToClipboard } from "components/hooks/useCopyToClipboard";
import { FC } from "react";
import { Button, ButtonIcon, ButtonText, Text, XStack, YStack } from "tamagui";
import { Page } from "utils/enums/wallet";

export const Deposit: FC<{
  walletAddress: PublicKey;
  setPage?: React.Dispatch<React.SetStateAction<Page>>;
}> = ({ walletAddress, setPage }) => {
  const copyToClipboard = useCopyToClipboard();
  return (
    <YStack gap={"$8"} padding={"$4"} alignItems="center">
      <XStack
        padding="$2"
        justifyContent="space-between"
        alignItems="center"
        width={"100%"}
      >
        <Button
          backgroundColor={"$colorTransparent"}
          onPress={() => setPage && setPage(Page.Main)}
        >
          <ArrowLeft opacity={setPage ? 1 : 0} />
        </Button>
        <Text
          numberOfLines={1}
          width={"70%"}
          textAlign="center"
          fontSize={"$8"}
          fontWeight={800}
        >{`Deposit`}</Text>
        <Button opacity={0}>
          <ArrowLeft />
        </Button>
      </XStack>

      <Text textAlign="center" fontSize={"$5"}>
        Send assets to the wallet address below
      </Text>
      <Text fontSize={"$5"} textAlign="center" width={"80%"}>
        {walletAddress.toString()}
      </Text>
      <Button onPress={() => copyToClipboard(walletAddress.toString())}>
        <ButtonText>Copy</ButtonText>
        <ButtonIcon children={<Copy />}></ButtonIcon>
      </Button>
      <Text color={"$accentColor"} textAlign="center">
        This address can only receive assets on Solana.
      </Text>
    </YStack>
  );
};
