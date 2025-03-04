import { DAS } from "@revibase/token-transfer";
import { AlertCircle } from "@tamagui/lucide-icons";
import { DeviceWallet } from "components/DeviceWallet";
import { useAssetValidation } from "components/hooks/useAssetValidation";
import { useGetMultiWallets } from "components/hooks/useGetMultiWallets";
import { Onboarding } from "components/onboarding";
import { Paymaster } from "components/Paymaster";
import { CustomCard } from "components/ui/CustomCard";
import { FC, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Heading,
  ScrollView,
  Spinner,
  Text,
  useWindowDimensions,
  XStack,
  YStack,
} from "tamagui";
import {
  formatAmount,
  PLACEHOLDER_IMAGE,
  useGlobalStore,
  WalletType,
} from "utils";

export default function profile() {
  const { deviceWalletPublicKey, paymasterWalletPublicKey, isHydrated } =
    useGlobalStore();
  const { top } = useSafeAreaInsets();

  return (
    <YStack flex={1} pt={top} px={"$3"} pb={"$4"}>
      {!isHydrated ? (
        <YStack flex={1} items="center" justify="center">
          <Spinner />
          <Text>Loading...</Text>
        </YStack>
      ) : !deviceWalletPublicKey || !paymasterWalletPublicKey ? (
        <Onboarding />
      ) : (
        <Profile />
      )}
    </YStack>
  );
}

const Profile: FC<{}> = () => {
  const { setWalletSheetArgs } = useGlobalStore();
  const [parentWidth, setParentWidth] = useState(0);
  const { hasAsset } = useAssetValidation();
  const { multiWallets } = useGetMultiWallets();
  const { height } = useWindowDimensions();
  return (
    <ScrollView
      contentContainerStyle={{ gap: 16, pt: 16, pb: Math.round(height * 0.15) }}
      flex={1}
      showsVerticalScrollIndicator={false}
    >
      <XStack items={"center"} justify={"space-between"}>
        <Heading size={"$5"}>Your Wallets</Heading>
        <Paymaster />
      </XStack>
      <DeviceWallet />
      <YStack width={"100%"} gap="$2">
        <Heading size={"$3"}>Collectible Wallets</Heading>
        <YStack
          width={"100%"}
          onLayout={(event) => setParentWidth(event.nativeEvent.layout.width)}
          flexWrap="wrap"
          flexDirection="row"
          gap={16}
        >
          {parentWidth > 0 &&
            multiWallets?.map((x) => {
              const parsedMetadata = x.fullMetadata
                ? (JSON.parse(x.fullMetadata) as DAS.GetAssetResponse)
                : undefined;
              return (
                <YStack
                  key={x.createKey}
                  width={(parentWidth - 32) / 3}
                  height={(parentWidth - 32) / 3}
                  gap={"$2"}
                  justify="space-between"
                  items="center"
                  bg={"$colorTransparent"}
                  hoverStyle={{ scale: 0.925 }}
                  pressStyle={{ scale: 0.875 }}
                  animation="bouncy"
                  onPress={() => {
                    setWalletSheetArgs({
                      walletAddress: x.createKey,
                      type: WalletType.MULTIWALLET,
                      mint: x.metadata || null,
                      theme: "accent",
                    });
                  }}
                >
                  <XStack
                    maxW={"80%"}
                    px={"$2"}
                    justify="center"
                    items="baseline"
                    gap={"$1"}
                  >
                    <Text fontSize={"$1"}>USD</Text>
                    <Text numberOfLines={1} fontSize={"$5"} fontWeight={"800"}>
                      {`${formatAmount(x.totalValue)}`}
                    </Text>
                  </XStack>
                  <CustomCard
                    height={"$8"}
                    url={
                      x.data?.content?.links?.image ||
                      parsedMetadata?.content?.links?.image ||
                      PLACEHOLDER_IMAGE
                    }
                  />
                  <XStack
                    maxW={"80%"}
                    px={"$2"}
                    justify={"center"}
                    gap={"$2"}
                    items={"center"}
                  >
                    {x.metadata &&
                      !hasAsset(
                        x.data,
                        x.vaultAddress,
                        false,
                        true,
                        true,
                        WalletType.MULTIWALLET
                      ) && <AlertCircle size={"$1"} color={"red"} />}
                    <Text numberOfLines={1} fontSize={"$3"}>
                      {x.data?.content?.metadata.name ||
                        parsedMetadata?.content?.metadata?.name ||
                        x.vaultAddress}
                    </Text>
                  </XStack>
                </YStack>
              );
            })}
        </YStack>
      </YStack>
    </ScrollView>
  );
};
