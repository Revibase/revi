import { Copy } from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { useCopyToClipboard } from "components/hooks";
<<<<<<< Updated upstream
import { FC, useState } from "react";
=======
import { CustomButton } from "components/ui/CustomButton";
import { FC, useCallback, useEffect, useRef, useState } from "react";
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    cloudStorage,
=======
    paymasterWalletPublicKey,
>>>>>>> Stashed changes
    deviceWalletPublicKey,
    cloudWalletPublicKey,
    setCloudWalletPublicKey,
    setDeviceWalletPublicKey,
  } = useGlobalStore();
  const [secret, setSecret] = useState("");
  const copyToClipboard = useCopyToClipboard();
  const theme = useTheme();
  const exportWallet = useExportWallet({ cloudStorage });
  const resetWallet = useResetWallet({
<<<<<<< Updated upstream
    cloudStorage,
=======
    paymasterWalletPublicKey,
>>>>>>> Stashed changes
    deviceWalletPublicKey,
    cloudWalletPublicKey,
    setCloudWalletPublicKey,
    setDeviceWalletPublicKey,
  });
<<<<<<< Updated upstream
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>();
  return (
    <>
      <YGroup>
        {["Show Private Key", "Reveal Seed Phrase", "Remove Wallet"].map(
          (label, index) => (
            <YGroup.Item key={label}>
              <CustomButton
                color={index === 2 ? theme.red10 : theme.color}
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
                            setWalletSheetArgs(null);
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
=======
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleRevealSecret = useCallback(
    async (returnMnemonic: boolean) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      const result = await exportWallet.mutateAsync({
        walletType,
        returnMnemonic,
      });
      if (result) {
        setSecret(result);
        timeoutRef.current = setTimeout(() => setSecret(""), 10_000);
      }
    },
    [walletType]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setSecret("");
    };
  }, []);

  return (
    <>
      <YGroup>
        <YGroup.Item>
          <CustomButton
            color={theme.color}
            onPress={() => {
              handleRevealSecret(true);
            }}
          >
            <ButtonText>{"Show Seed Phrase"}</ButtonText>
          </CustomButton>
        </YGroup.Item>
        <YGroup.Item>
          <CustomButton
            color={theme.color}
            onPress={() => {
              handleRevealSecret(false);
            }}
          >
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
>>>>>>> Stashed changes
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
