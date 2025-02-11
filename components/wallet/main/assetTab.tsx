import { getVaultFromAddress } from "@revibase/multi-wallet";
import { PublicKey } from "@solana/web3.js";
import { AlertTriangle } from "@tamagui/lucide-icons";
import { CustomCard } from "components/CustomCard";
import { useWalletInfo } from "components/hooks";
import { FC } from "react";
import { Text, XStack, YStack } from "tamagui";
import {
  Page,
  PLACEHOLDER_IMAGE,
  useGetAsset,
  useGetAssetsByOwner,
  useGlobalStore,
} from "utils";
import { Asset } from "../asset";

export const AssetTab: FC = () => {
  const { walletSheetArgs, setPage } = useGlobalStore();
  const { mint, type, walletAddress } = walletSheetArgs ?? {};
  const { walletInfo } = useWalletInfo({ walletAddress, type });
  const { data: mintData } = useGetAsset({ mint });
  const { data: allAssets } = useGetAssetsByOwner({
    address:
      walletInfo && walletAddress
        ? getVaultFromAddress(new PublicKey(walletAddress)).toString()
        : walletAddress,
  });
  const asset = allAssets?.items.find((x) => x.id === mint?.toString());
  return (
    mintData && (
      <YStack width={"100%"} gap="$4" items="center">
        <YStack width={"80%"} items="center" gap="$1" justify="center">
          <Text numberOfLines={1} fontSize={"$7"} fontWeight={800}>
            {mintData?.content?.metadata.name}
          </Text>
          {!asset && (
            <XStack gap="$2" items="center" justify="center">
              <AlertTriangle color="red" />
              <Text color="red">{`${mintData.content?.metadata.name} not found.`}</Text>
            </XStack>
          )}
        </YStack>
        <CustomCard
          height={"$20"}
          shadowColor={"white"}
          url={mintData.content?.links?.image || PLACEHOLDER_IMAGE}
        />
        <Asset asset={asset ?? mintData} callback={() => setPage(Page.Main)} />
      </YStack>
    )
  );
};
