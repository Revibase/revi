import { getVaultFromAddress } from "@revibase/multi-wallet";
import { PublicKey } from "@solana/web3.js";
import { Copy } from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { useCopyToClipboard } from "components/hooks";
import { FC } from "react";
import { ButtonIcon, ButtonText, Text, YStack } from "tamagui";
import { Page, useGlobalStore, WalletType } from "utils";
import { ScreenWrapper } from "./screenWrapper";

export const Deposit: FC = () => {
  const { walletSheetArgs, setPage } = useGlobalStore();
  const { walletAddress, type } = walletSheetArgs ?? {};
  const address =
    type === WalletType.MULTIWALLET && walletAddress
      ? getVaultFromAddress(new PublicKey(walletAddress)).toString()
      : walletAddress;
  const copyToClipboard = useCopyToClipboard();
  return (
    <ScreenWrapper text="Deposit" reset={() => setPage(Page.Main)}>
      <YStack items="center" gap={"$8"}>
        <Text text="center" fontSize={"$5"}>
          Send assets to the wallet address below
        </Text>
        <Text fontSize={"$5"} text="center" width={"80%"}>
          {address}
        </Text>
        <CustomButton onPress={() => copyToClipboard(address || "")}>
          <ButtonText>Copy</ButtonText>
          <ButtonIcon children={<Copy />}></ButtonIcon>
        </CustomButton>
        <Text fontSize={"$5"} text="center">
          This address can only receive assets on Solana.
        </Text>
      </YStack>
    </ScreenWrapper>
  );
};
