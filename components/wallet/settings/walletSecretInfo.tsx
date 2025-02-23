import { Copy } from "@tamagui/lucide-icons";
import { useCopyToClipboard } from "components/hooks";
import { CustomButton } from "components/ui/CustomButton";
import { FC, useState } from "react";
import { Alert } from "react-native";
import {
  ButtonIcon,
  ButtonText,
  Spinner,
  Text,
  useTheme,
  YGroup,
  YStack,
} from "tamagui";
import {
  useExportWallet,
  useGlobalStore,
  useResetWallet,
  WalletType,
} from "utils";

export const RenderSecretButtons: FC<{
  walletType: WalletType;
}> = ({ walletType }) => {
  const {
    setWalletSheetArgs,
    deviceWalletPublicKey,
    setPaymasterWalletPublicKey,
    setDeviceWalletPublicKey,
  } = useGlobalStore();
  const [secret, setSecret] = useState("");
  const copyToClipboard = useCopyToClipboard();
  const theme = useTheme();
  const exportWallet = useExportWallet();
  const resetWallet = useResetWallet({
    deviceWalletPublicKey,
    setPaymasterWalletPublicKey,
    setDeviceWalletPublicKey,
  });
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>();

  return (
    <>
      <YGroup>
        <YGroup.Item>
          <CustomButton
            color={theme.color}
            onPress={async () => {
              setSelectedIndex(1);
              const result = await exportWallet.mutateAsync({
                walletType: walletType,
                returnMnemonic: true,
              });
              setSelectedIndex(undefined);
              if (result) setSecret(result);
            }}
          >
            {exportWallet.isPending && 1 === selectedIndex && <Spinner />}
            <ButtonText>{"Show Seed Phrase"}</ButtonText>
          </CustomButton>
        </YGroup.Item>
        <YGroup.Item>
          <CustomButton
            color={theme.color}
            onPress={async () => {
              setSelectedIndex(2);
              const result = await exportWallet.mutateAsync({
                walletType: walletType,
                returnMnemonic: false,
              });
              setSelectedIndex(undefined);
              if (result) setSecret(result);
            }}
          >
            {exportWallet.isPending && 2 === selectedIndex && <Spinner />}
            <ButtonText>{"Show Private Key"}</ButtonText>
          </CustomButton>
        </YGroup.Item>
        <YGroup.Item>
          <CustomButton
            color={theme.red10}
            onPress={async () => {
              Alert.alert(
                "Are you certain you want to remove the current wallet?",
                walletType === WalletType.DEVICE
                  ? "Warning: This action cannot be undone. Ensure your seed phrase is securely saved before continuing."
                  : "",
                [
                  { text: "Cancel" },
                  {
                    text: "Ok",
                    onPress: async () => {
                      await resetWallet.mutateAsync({ walletType });
                      setSelectedIndex(undefined);
                      setWalletSheetArgs(null);
                    },
                  },
                ]
              );
            }}
          >
            {resetWallet.isPending && <Spinner />}
            <ButtonText>{"Remove Wallet"}</ButtonText>
          </CustomButton>
        </YGroup.Item>
      </YGroup>
      {secret && (
        <YStack
          gap={"$4"}
          borderWidth={"$1"}
          borderColor={"$borderColor"}
          p={"$2"}
          borderTopLeftRadius={"$4"}
          borderTopRightRadius={"$4"}
          borderBottomLeftRadius={"$4"}
          borderBottomRightRadius={"$4"}
          items="center"
          bg={"$background"}
        >
          <Text text="center" p={"$2"}>
            {secret}
          </Text>
          <CustomButton onPress={() => copyToClipboard(secret)}>
            <ButtonText>Copy</ButtonText>
            <ButtonIcon children={<Copy />} />
          </CustomButton>
        </YStack>
      )}
    </>
  );
};
