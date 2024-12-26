import { Copy } from "@tamagui/lucide-icons";
import { useCopyToClipboard } from "components/hooks/useCopyToClipboard";
import { FC, useState } from "react";
import { Button, ButtonIcon, ButtonText, Text, YGroup, YStack } from "tamagui";

export const RenderSecretButtons: FC<{
  exportFunction: any;
}> = ({ exportFunction }) => {
  const [secret, setSecret] = useState("");
  const copyToClipboard = useCopyToClipboard();
  return (
    <>
      <YGroup bordered>
        {["Show Private Key", "Reveal Seed Phrase"].map((label, index) => (
          <YGroup.Item key={label}>
            <Button
              onPress={async () => {
                const result = await exportFunction.mutateAsync({
                  returnMnemonic: index === 1,
                });
                if (result) setSecret(result);
              }}
            >
              <ButtonText>{label}</ButtonText>
            </Button>
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
          <Button onPress={() => copyToClipboard(secret)}>
            <ButtonText>Copy</ButtonText>
            <ButtonIcon children={<Copy />} />
          </Button>
        </YStack>
      )}
    </>
  );
};
