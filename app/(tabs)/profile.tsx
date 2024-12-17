import { PublicKey } from "@solana/web3.js";
import {
  Cloud,
  EllipsisVertical,
  Wallet as WalletIcon,
} from "@tamagui/lucide-icons";
import { useGlobalVariables } from "components/providers/globalProvider";
import { Wallet } from "components/wallet";
import { router } from "expo-router";
import { FC, useEffect, useState } from "react";
import {
  Button,
  ButtonText,
  Heading,
  Image,
  ListItem,
  Popover,
  Sheet,
  Spinner,
  Text,
  XStack,
  YGroup,
  YStack,
} from "tamagui";
import { getAssetBatch } from "utils/helper";
import { useGenerateCloudWallet } from "utils/mutations/generateCloudWallet";
import { useGenerateDeviceWallet } from "utils/mutations/generateDeviceWallet";
import { useGetMultisigByOwner } from "utils/queries/useGetMultisigByOwner";
import { DAS } from "utils/types/das";

export default function profile() {
  const { deviceAddress, cloudAddress } = useGlobalVariables();

  return deviceAddress && cloudAddress ? <Profile /> : <Onboarding />;
}

const Onboarding: FC = () => {
  const { deviceAddress, cloudAddress } = useGlobalVariables();
  const generateDeviceWalletMutation = useGenerateDeviceWallet();
  const generateCloudWalletMutation = useGenerateCloudWallet();

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$8">
      <Heading color="black">{`${
        !deviceAddress
          ? "Step 1: Set Up a Device Wallet"
          : !cloudAddress
          ? "Step 2: Set Up a Cloud Wallet"
          : "You're all set!"
      }`}</Heading>
      <Text color="black" textAlign="center" padding={"$4"} fontSize={"$6"}>
        {`${
          !deviceAddress
            ? "The wallet's private key is securely stored on your device and can only be accessed with your biometrics."
            : !cloudAddress
            ? "The cloud wallet is stored on your personal icloud and is used as a 2FA wallet."
            : ""
        }`}
      </Text>
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
            ? "Generate Cloud Wallet"
            : "Back To Home!"
        }`}</ButtonText>
      </Button>
    </YStack>
  );
};
const Profile: FC<{}> = () => {
  const { deviceAddress, cloudAddress } = useGlobalVariables();
  const { data: multiWallets } = useGetMultisigByOwner({
    address: deviceAddress,
  });

  const generateDeviceWalletMutation = useGenerateDeviceWallet();
  const generateCloudWalletMutation = useGenerateCloudWallet();
  const [multiWalletsWithData, setMultiWalletsWithData] = useState<
    {
      data: DAS.GetAssetResponse | undefined;
      publicKey: PublicKey;
      account: {
        createKey: PublicKey;
        threshold: number;
        bump: number;
        members: PublicKey[];
        label: string | null;
      };
    }[]
  >([]);

  useEffect(() => {
    const fetchMultiWalletData = async () => {
      if (!multiWallets) return;

      const filteredLabels = multiWallets
        .filter((x) => !!x.account.label)
        .map((x) => x.account.label!);

      try {
        const multiWalletData = await getAssetBatch(filteredLabels);

        const walletsWithData = multiWallets.map((x) => ({
          ...x,
          data: multiWalletData.find((data) => data.id === x.account.label),
        }));

        setMultiWalletsWithData(walletsWithData);
      } catch (error) {
        console.error("Error fetching wallet data:", error);
      }
    };

    fetchMultiWalletData();
  }, [multiWallets]);
  const [address, setAddress] = useState<PublicKey | undefined | null>(null);
  const [mint, setMint] = useState<PublicKey | undefined>(undefined);

  const reset = () => {
    setAddress(null);
    setMint(undefined);
  };

  return (
    <YStack gap={"$4"} padding="$4">
      <Heading color={"black"}>Wallet Management</Heading>
      <XStack
        width={"100%"}
        alignSelf="center"
        gap={"$4"}
        justifyContent="space-between"
        alignItems="center"
      >
        <ListItem
          maxWidth={"48%"}
          borderRadius={"$4"}
          padded
          bordered
          hoverTheme
          pressTheme
          title={
            <XStack alignItems="center" gap={"$2"}>
              <WalletIcon size={"$1"} />
              <Text>Device Wallet</Text>
            </XStack>
          }
          subTitle={deviceAddress?.toString()}
          iconAfter={
            <Popover>
              <Popover.Trigger asChild>
                <Button
                  backgroundColor={"transparent"}
                  padding="$0"
                  icon={<EllipsisVertical />}
                />
              </Popover.Trigger>
              <Popover.Content
                padding={"$0"}
                borderWidth={1}
                borderColor="$borderColor"
                enterStyle={{ y: -10, opacity: 0 }}
                exitStyle={{ y: -10, opacity: 0 }}
                elevate
                animation={[
                  "quick",
                  {
                    opacity: {
                      overshootClamping: true,
                    },
                  },
                ]}
              >
                <YGroup>
                  <YGroup.Item>
                    <Button
                      disabled={generateDeviceWalletMutation.isPending}
                      onPress={() => {
                        generateDeviceWalletMutation.mutateAsync();
                      }}
                    >
                      <ButtonText>Generate New Device Key</ButtonText>
                      {generateDeviceWalletMutation.isPending && <Spinner />}
                    </Button>
                  </YGroup.Item>
                </YGroup>
              </Popover.Content>
            </Popover>
          }
        />
        <ListItem
          maxWidth={"48%"}
          borderRadius={"$4"}
          padded
          bordered
          hoverTheme
          pressTheme
          title={
            <XStack alignItems="center" gap={"$2"}>
              <Cloud size={"$1"} />
              <Text>Cloud Wallet</Text>
            </XStack>
          }
          subTitle={cloudAddress?.toString()}
          iconAfter={
            <Popover>
              <Popover.Trigger asChild>
                <Button
                  backgroundColor={"transparent"}
                  padding="$0"
                  icon={<EllipsisVertical />}
                />
              </Popover.Trigger>
              <Popover.Content
                padding={"$0"}
                borderWidth={1}
                borderColor="$borderColor"
                enterStyle={{ y: -10, opacity: 0 }}
                exitStyle={{ y: -10, opacity: 0 }}
                elevate
                animation={[
                  "quick",
                  {
                    opacity: {
                      overshootClamping: true,
                    },
                  },
                ]}
              >
                <YGroup>
                  <YGroup.Item>
                    <Button
                      disabled={generateCloudWalletMutation.isPending}
                      onPress={() => {
                        generateCloudWalletMutation.mutateAsync();
                      }}
                    >
                      <ButtonText>Generate New Cloud Key</ButtonText>
                      {generateCloudWalletMutation.isPending && <Spinner />}
                    </Button>
                  </YGroup.Item>
                </YGroup>
              </Popover.Content>
            </Popover>
          }
        />
      </XStack>
      <YStack width={"100%"} gap="$2">
        <Heading size={"$6"} color={"black"}>
          Your Multisig Wallets
        </Heading>
        <YStack
          width={"100%"}
          flexWrap="wrap" // Allow items to wrap within the container
          flexDirection="row" // Make the children flow in rows
          gap="$4" // Spacing between grid items
        >
          {multiWalletsWithData?.map((x) => {
            return (
              <Button
                padded={false}
                key={x.publicKey.toString()}
                width="50%"
                aspectRatio={1}
                justifyContent="center"
                alignItems="center"
                borderRadius="$4"
                padding={0}
                onPress={() => {
                  setAddress(new PublicKey(x.account.createKey));
                  setMint(
                    x.account.label ? new PublicKey(x.account.label) : undefined
                  );
                }}
              >
                <Image
                  borderRadius={"$4"}
                  height={"100%"}
                  width={"100%"}
                  objectFit="contain"
                  source={{ uri: x?.data?.content?.links?.image }}
                  alt="image"
                />
              </Button>
            );
          })}
        </YStack>
      </YStack>
      <Sheets address={address} reset={reset} mint={mint} />
    </YStack>
  );
};

const Sheets: FC<{
  address: PublicKey | null | undefined;
  reset: () => void;
  mint: PublicKey | undefined;
}> = ({ address, reset, mint }) => {
  return (
    <Sheet
      forceRemoveScrollEnabled={true}
      modal={true}
      open={!!address}
      defaultOpen={false}
      snapPoints={[95]}
      zIndex={100_000}
      animation="medium"
      snapPointsMode={"percent"}
      onOpenChange={(open) => {
        if (!open) {
          reset();
        }
      }}
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        key="overlay"
        opacity={0.5}
      />
      <Sheet.Handle />
      <Sheet.Frame
        padding="$4"
        justifyContent="center"
        alignItems="center"
        gap="$4"
      >
        <Sheet.ScrollView width={"100%"} showsVerticalScrollIndicator={false}>
          {address && (
            <Wallet walletAddress={address} mint={mint} close={() => reset()} />
          )}
        </Sheet.ScrollView>
      </Sheet.Frame>
    </Sheet>
  );
};
