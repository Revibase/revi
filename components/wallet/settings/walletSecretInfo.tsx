import { Copy } from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { useCopyToClipboard } from "components/hooks/useCopyToClipboard";
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
import { WalletType } from "utils/enums/wallet";
import { useExportWallet } from "utils/mutations/exportWallet";
import { useResetWallet } from "utils/mutations/resetWallet";

export const RenderSecretButtons: FC<{
  walletType: WalletType;
  closeSheet: () => void;
}> = ({ walletType, closeSheet }) => {
  const [secret, setSecret] = useState("");
  const copyToClipboard = useCopyToClipboard();
  const theme = useTheme();
  const exportWallet = useExportWallet();
  const resetWallet = useResetWallet();
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>();
  return (
    <>
      <YGroup>
        {["Show Private Key", "Reveal Seed Phrase", "Remove Wallet"].map(
          (label, index) => (
            <YGroup.Item key={label}>
              <CustomButton
                color={index === 2 ? theme.red10.val : theme.color.val}
                onPress={async () => {
                  setSelectedIndex(index);
                  if (index === 2) {
                    Alert.alert(
                      "Are you certain you want to delete the current wallet?",
                      "Warning: This action cannot be undone. Ensure your seed phrase is securely saved before continuing.",
                      [
                        { text: "Cancel" },
                        {
                          text: "Ok",
                          onPress: async () => {
                            await resetWallet.mutateAsync({ walletType });
                            setSelectedIndex(undefined);
                            closeSheet();
                          },
                        },
                      ]
                    );
                  } else {
                    const result = await exportWallet.mutateAsync({
                      walletType: walletType,
                      returnMnemonic: index === 1,
                    });
                    setSelectedIndex(undefined);
                    if (result) setSecret(result);
                  }
                }}
              >
                {(exportWallet.isPending || resetWallet.isPending) &&
                  index === selectedIndex && <Spinner />}
                <ButtonText>{label}</ButtonText>
              </CustomButton>
            </YGroup.Item>
          )
        )}
      </YGroup>
      {secret && (
        <YStack
          gap={"$4"}
          borderWidth={"$1"}
          padding={"$2"}
          borderRadius={"$4"}
          alignItems="center"
        >
          <Text textAlign="center" padding={"$2"}>
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
