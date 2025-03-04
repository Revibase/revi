import { getVaultFromAddress } from "@revibase/multi-wallet";
import { DAS } from "@revibase/token-transfer";
import { PublicKey } from "@solana/web3.js";
import { AlertTriangle } from "@tamagui/lucide-icons";
import { CustomCard } from "components/CustomCard";
import { useWalletInfo } from "components/hooks";
import { FC } from "react";
import { Text, XStack, YStack } from "tamagui";
import {
  Page,
  PLACEHOLDER_IMAGE,
  useGetAssetsByOwner,
  useGlobalStore,
} from "utils";
import { Asset } from "../asset";

export const AssetTab: FC = () => {
  const { walletSheetArgs, setPage } = useGlobalStore();
  const { mint, type, walletAddress } = walletSheetArgs ?? {};
  const { walletInfo } = useWalletInfo({ walletAddress, type });
  const parsedMetadata = walletInfo?.fullMetadata
    ? (JSON.parse(walletInfo.fullMetadata) as DAS.GetAssetResponse)
    : undefined;
  const { data: allAssets } = useGetAssetsByOwner({
    address:
      walletInfo && walletAddress
        ? getVaultFromAddress(new PublicKey(walletAddress)).toString()
        : walletAddress,
  });
  const asset = allAssets?.items.find((x) => x.id === mint);
  return (
    parsedMetadata && (
      <YStack width={"100%"} gap="$4" items="center">
        <YStack width={"80%"} items="center" gap="$1" justify="center">
          <Text numberOfLines={1} fontSize={"$7"} fontWeight={800}>
            {parsedMetadata?.content?.metadata.name}
          </Text>
          {!asset && (
            <XStack gap="$2" items="center" justify="center">
              <AlertTriangle color="red" />
              <Text color="red">{`${parsedMetadata.content?.metadata.name} not found.`}</Text>
            </XStack>
          )}
        </YStack>
        <CustomCard
          height={"$20"}
          shadowColor={"white"}
          url={parsedMetadata.content?.links?.image || PLACEHOLDER_IMAGE}
        />
        <Asset
          asset={asset ?? parsedMetadata}
          callback={() => setPage(Page.Main)}
        />
      </YStack>
    )
  );
};
