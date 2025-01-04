import { Copy } from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { useCopyToClipboard } from "components/hooks/useCopyToClipboard";
import { FC, useState } from "react";
import { ButtonIcon, ButtonText, Text, YGroup, YStack } from "tamagui";
import { WalletType } from "utils/enums/wallet";
import { useExportWallet } from "utils/mutations/exportWallet";

export const RenderSecretButtons: FC<{
  walletType: WalletType;
}> = ({ walletType }) => {
  const [secret, setSecret] = useState("");
  const copyToClipboard = useCopyToClipboard();
  const exportWallet = useExportWallet();
  return (
    <>
      <YGroup>
        {["Show Private Key", "Reveal Seed Phrase"].map((label, index) => (
          <YGroup.Item key={label}>
            <CustomButton
              onPress={async () => {
                const result = await exportWallet.mutateAsync({
                  walletType: walletType,
                  returnMnemonic: index === 1,
                });
                if (result) setSecret(result);
              }}
            >
              <ButtonText>{label}</ButtonText>
            </CustomButton>
          </YGroup.Item>
        ))}
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
