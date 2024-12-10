import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  Cloud,
  EllipsisVertical,
  HelpCircle,
  ShoppingCart,
  Wallet,
  X,
} from "@tamagui/lucide-icons";
import { useOnboarding } from "components/providers/onboardingProvider";
import { Deposit } from "components/wallet/deposit";
import { router } from "expo-router";
import { FC, useState } from "react";
import { SafeAreaView } from "react-native";
import {
  Button,
  ButtonText,
  Dialog,
  Heading,
  ListItem,
  Text,
  Unspaced,
  XGroup,
  XStack,
  YStack,
} from "tamagui";
import { useGenerateCloudWallet } from "utils/mutations/generateCloudWallet";
import { useGenerateDeviceWallet } from "utils/mutations/generateDeviceWallet";
import { useGetAssetsByOwner } from "utils/queries/useGetAssetsByOwner";

export default function profile() {
  const { deviceAddress, cloudAddress } = useOnboarding();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {deviceAddress && cloudAddress ? <Profile /> : <Onboarding />}
    </SafeAreaView>
  );
}

const Onboarding: FC = () => {
  const { deviceAddress, cloudAddress } = useOnboarding();
  const generateDeviceWalletMutation = useGenerateDeviceWallet();
  const generateCloudWalletMutation = useGenerateCloudWallet();

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$8">
      <Heading>{`${
        !deviceAddress
          ? "Step 1: Set Up a Device Wallet"
          : !cloudAddress
          ? "Step 2: Set Up a 2FA Wallet"
          : "You're all set!"
      }`}</Heading>
      <Text textAlign="center" padding={"$4"} fontSize={"$6"}>
        {`${
          !deviceAddress
            ? "The wallet's private key is securely stored on your device and can only be accessed using your biometrics."
            : !cloudAddress
            ? "The 2FA wallet is encrypted and stored securely on your personal icloud."
            : ""
        }`}
      </Text>
      {deviceAddress && cloudAddress && (
        <>
          <Text>{`Device Wallet: ${deviceAddress.toString()}`}</Text>
          <Text>{`2FA Wallet: ${cloudAddress.toString()}`}</Text>
        </>
      )}
      <Button
        onPress={() => {
          if (!deviceAddress) {
            generateDeviceWalletMutation.mutateAsync();
          } else if (!cloudAddress) {
            generateCloudWalletMutation.mutateAsync();
          } else {
            router.replace("/(tabs)/profile");
          }
        }}
      >
        <ButtonText>{`${
          !deviceAddress
            ? "Generate Device Wallet"
            : !cloudAddress
            ? "Generate 2FA Wallet"
            : "Back To Home!"
        }`}</ButtonText>
      </Button>
    </YStack>
  );
};
const Profile: FC<{}> = () => {
  const { deviceAddress, cloudAddress } = useOnboarding();
  const { data: allAssets } = useGetAssetsByOwner({
    address: deviceAddress || null,
  });
  const [open, setOpen] = useState(false);
  return (
    <SafeAreaView>
      <YStack alignItems="center" gap={"$4"} padding="$4">
        <Dialog open={open} modal>
          <XGroup
            width={"100%"}
            alignSelf="center"
            gap={"$4"}
            justifyContent="space-between"
            alignItems="center"
          >
            <XGroup.Item>
              <ListItem
                maxWidth={"48%"}
                padded
                bordered
                hoverTheme
                pressTheme
                title={
                  <XStack alignItems="center" gap={"$2"}>
                    <Wallet size={"$1"} />
                    <Text>Device Wallet</Text>
                  </XStack>
                }
                subTitle={deviceAddress?.toString()}
                iconAfter={EllipsisVertical}
              />
            </XGroup.Item>
            <XGroup.Item>
              <ListItem
                maxWidth={"48%"}
                padded
                bordered
                hoverTheme
                pressTheme
                title={
                  <XStack alignItems="center" gap={"$2"}>
                    <Cloud size={"$1"} />
                    <Text>2FA Wallet</Text>
                  </XStack>
                }
                subTitle={cloudAddress?.toString()}
                iconAfter={EllipsisVertical}
              />
            </XGroup.Item>
          </XGroup>
          <ListItem
            borderRadius={"$4"}
            bordered
            padded
            hoverTheme
            pressTheme
            title={
              <XStack alignItems="center" gap={"$2"}>
                <Text>{`Fees Payer (Device Wallet)`}</Text>
                <HelpCircle size={"$1"} />
              </XStack>
            }
            subTitle={`${
              (allAssets?.nativeBalance.lamports || 0) / LAMPORTS_PER_SOL
            } SOL`}
            icon={<ShoppingCart size={"$1"} />}
            iconAfter={
              <Dialog.Trigger asChild>
                <Button
                  onPress={() => setOpen(true)}
                  size={"$3"}
                  theme={"blue_active"}
                >
                  <ButtonText>Top Up</ButtonText>
                </Button>
              </Dialog.Trigger>
            }
          />
          <Dialog.Portal>
            <Dialog.Overlay
              key="overlay"
              animation="slow"
              opacity={0.5}
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
              onPress={() => setOpen(false)}
            />
            <Dialog.Content
              width={"95%"}
              bordered
              elevate
              key="content"
              animateOnly={["transform", "opacity"]}
              animation={[
                "quicker",
                {
                  opacity: {
                    overshootClamping: true,
                  },
                },
              ]}
              enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
              exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
              gap="$4"
            >
              <Deposit walletAddress={deviceAddress!} isMultiSig={false} />
              <Unspaced>
                <Dialog.Close asChild>
                  <Button
                    onPress={() => setOpen(false)}
                    position="absolute"
                    top="$3"
                    right="$3"
                    size="$2"
                    circular
                    icon={X}
                  />
                </Dialog.Close>
              </Unspaced>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      </YStack>
    </SafeAreaView>
  );
};
