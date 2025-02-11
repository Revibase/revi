import { useWalletInfo } from "components/hooks";
import { Image } from "expo-image";
import { FC, useEffect } from "react";
import { Spinner, YStack } from "tamagui";
import { Page, useGetAsset, useGlobalStore, WalletType } from "utils";
import { AssetPage } from "./asset";
import { BlinksPage } from "./blinks";
import { BlinksCard } from "./blinks/card";
import { CreateMultisigPage } from "./create";
import { Deposit } from "./deposit";
import { Main } from "./main";
import { OffersPage } from "./offers";
import { OfferCard } from "./offers/card";
import { SearchPage } from "./search";
import { SettingsPage } from "./settings";
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

  useEffect(() => {
    if (page === Page.Loading && !isLoading) {
      if (
        (!walletInfo ||
          (!!walletInfo.metadata && walletInfo.metadata.toString() !== mint)) &&
        type === WalletType.MULTIWALLET
      ) {
        setPage(Page.Create);
      } else {
        setPage(Page.Main);
      }
    }
  }, [walletInfo, type, isLoading, mint, page]);

  const { data: asset } = useGetAsset({
    mint,
  });
  return (
    <YStack minH={"100%"} position="relative">
      {asset?.content?.links?.image && (
        <Image
          priority={"high"}
          style={{
            height: "100%",
            width: "100%",
            position: "absolute",
            opacity: 0.1,
          }}
          source={{
            uri: asset.content.links.image,
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
      {page === Page.BlinksPage && <BlinksPage />}
      {page === Page.Blinks && <BlinksCard />}
      {page === Page.OffersPage && <OffersPage />}
      {page === Page.Offer && <OfferCard />}
      {page == Page.Loading && (
        <YStack flex={1} bg={"transparent"} justify="center" items="center">
          <Spinner bg={"transparent"} size="large" />
        </YStack>
      )}
    </YStack>
  );
};
