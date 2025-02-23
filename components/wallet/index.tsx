import { DAS } from "@revibase/token-transfer";
import { useWalletInfo } from "components/hooks";
import { Image } from "expo-image";
import { FC, useEffect } from "react";
import { Spinner, YStack } from "tamagui";
import { Page, proxify, useGlobalStore, WalletType } from "utils";
import { AssetPage } from "./asset";
import { BlinksCard } from "./blinks/card";
import { CreateMultisigPage } from "./create";
import { Deposit } from "./deposit";
import { Main } from "./main";
import { OffersPage } from "./offers";
import { OfferCard } from "./offers/card";
import { SearchPage } from "./search";
import { SettingsPage } from "./settings";
import { SwapPage } from "./swap";
import { Withdrawal } from "./withdrawal";

export const Wallet: FC = () => {
  const { walletSheetArgs, setPage } = useGlobalStore();
  const {
    type,
    mint,
    walletAddress,
    page = Page.Loading,
  } = walletSheetArgs ?? {};

  const { walletInfo, isLoading } = useWalletInfo({ walletAddress, type });
  const parsedMetadata = walletInfo?.fullMetadata
    ? (JSON.parse(walletInfo.fullMetadata) as DAS.GetAssetResponse)
    : undefined;
  useEffect(() => {
    if (page === Page.Loading && !isLoading) {
      if (
        (!walletInfo ||
          (!!walletInfo.metadata && walletInfo.metadata !== mint)) &&
        type === WalletType.MULTIWALLET
      ) {
        setPage(Page.Create);
      } else {
        setPage(Page.Main);
      }
    }
  }, [walletInfo, type, isLoading, mint, page]);

  return (
    <YStack minH={"100%"} position="relative">
      {parsedMetadata?.content?.links?.image && (
        <Image
          priority={"high"}
          style={{
            height: "100%",
            width: "100%",
            position: "absolute",
            opacity: 0.1,
          }}
          source={{
            uri: proxify(parsedMetadata.content.links.image),
          }}
          contentFit="cover"
        />
      )}
      {page == Page.Main && <Main />}
      {page == Page.Deposit && <Deposit />}
      {page == Page.Withdrawal && <Withdrawal />}
      {page == Page.Asset && <AssetPage />}
      {page == Page.Create && <CreateMultisigPage />}
      {page == Page.Search && <SearchPage />}
      {page === Page.Settings && <SettingsPage />}
      {page === Page.Blinks && <BlinksCard />}
      {page === Page.OffersPage && <OffersPage />}
      {page === Page.Offer && <OfferCard />}
      {page === Page.Swap && <SwapPage />}
      {page == Page.Loading && (
        <YStack flex={1} bg={"transparent"} justify="center" items="center">
          <Spinner bg={"transparent"} size="large" />
        </YStack>
      )}
    </YStack>
  );
};
