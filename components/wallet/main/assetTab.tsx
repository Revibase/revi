import { PublicKey } from "@solana/web3.js";
import { AlertTriangle } from "@tamagui/lucide-icons";
import { FC } from "react";
import { Text, XStack, YStack } from "tamagui";
import { Page } from "utils/enums/page";
import { WalletType } from "utils/enums/wallet";
import { getMultiSigFromAddress, getVaultFromAddress } from "utils/helper";
import { useGetAsset } from "utils/queries/useGetAsset";
import { useGetAssetsByOwner } from "utils/queries/useGetAssetsByOwner";
import { useGetWalletInfo } from "utils/queries/useGetWalletInfo";
import { DAS } from "utils/types/das";
import { Asset } from "../asset";

export const AssetTab: FC<{
  mint: PublicKey;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  setWithdrawAsset: React.Dispatch<
    React.SetStateAction<
      | {
          asset: DAS.GetAssetResponse;
          callback?: () => void;
        }
      | undefined
    >
  >;
  walletAddress: PublicKey;
  type: WalletType;
}> = ({ mint, walletAddress, setPage, setWithdrawAsset, type }) => {
  const { data: walletInfo } = useGetWalletInfo({
    address:
      type === WalletType.MULTIWALLET
        ? getMultiSigFromAddress(walletAddress)
        : null,
  });
  const { data: mintData } = useGetAsset({ mint });
  const { data: allAssets } = useGetAssetsByOwner({
    address: walletInfo ? getVaultFromAddress(walletAddress) : walletAddress,
  });
  const hasAsset =
    allAssets?.items.findIndex((x) => x.id === mint?.toString()) !== -1;
  return (
    mintData && (
      <YStack width={"100%"} gap="$4" alignItems="center">
        <YStack
          width={"80%"}
          alignItems="center"
          gap="$1"
          justifyContent="center"
        >
          <Text numberOfLines={1} fontSize={"$7"} fontWeight={800}>
            {mintData?.content?.metadata.name}
          </Text>
          {!hasAsset && (
            <XStack gap="$2" alignItems="center" justifyContent="center">
              <AlertTriangle color="red" />
              <Text color="red">{`${mintData.content?.metadata.name} not found.`}</Text>
            </XStack>
          )}
        </YStack>
        <Asset
          type={type}
          walletAddress={walletAddress}
          asset={mintData}
          callback={() => setPage(Page.Main)}
          setPage={setPage}
          setWithdrawAsset={setWithdrawAsset}
        />
      </YStack>
    )
  );
};
