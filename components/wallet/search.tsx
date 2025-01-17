import { PublicKey } from "@solana/web3.js";
import { Search } from "@tamagui/lucide-icons";
import { CustomListItem } from "components/CustomListItem";
import { FC, useMemo, useState } from "react";
import { Avatar, AvatarImage, Input, XStack, YStack } from "tamagui";
import { Page } from "utils/enums/page";
import { WalletType } from "utils/enums/wallet";
import {
  getMultiSigFromAddress,
  getVaultFromAddress,
  SOL_NATIVE_MINT,
} from "utils/helper";
import { useGetAssetsByOwner } from "utils/queries/useGetAssetsByOwner";
import { useGetWalletInfo } from "utils/queries/useGetWalletInfo";
import { DAS } from "utils/types/das";
import { Header } from "./header";

export const SearchPage: FC<{
  type: WalletType;
  walletAddress: PublicKey;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  setViewAsset: React.Dispatch<
    React.SetStateAction<DAS.GetAssetResponse | undefined>
  >;
}> = ({ type, walletAddress, setPage, setViewAsset }) => {
  const { data: walletInfo } = useGetWalletInfo({
    address:
      type === WalletType.MULTIWALLET
        ? getMultiSigFromAddress(walletAddress)
        : null,
  });
  const { data: allAssets } = useGetAssetsByOwner({
    address: walletInfo ? getVaultFromAddress(walletAddress) : walletAddress,
  });
  const [searchText, setSearchText] = useState("");
  const filteredTokenList = useMemo(() => {
    return (
      allAssets?.items
        .filter(
          (x) =>
            x.interface === "FungibleToken" || x.interface === "FungibleAsset"
        )
        .concat([SOL_NATIVE_MINT(allAssets.nativeBalance)])
        .filter((x) => {
          if (!searchText) return true;
          return (
            x.content?.metadata.name
              .toLowerCase()
              .includes(searchText.toLowerCase()) ||
            x.content?.metadata.symbol
              .toLowerCase()
              .includes(searchText.toLowerCase())
          );
        }) || []
    );
  }, [allAssets, searchText]);

  return (
    <YStack
      enterStyle={{ opacity: 0, x: -25 }}
      animation={"quick"}
      width={"100%"}
      padding={"$4"}
      gap="$4"
    >
      <Header text={`Tokens`} reset={() => setPage(Page.Main)} />
      <XStack
        alignItems="center"
        borderWidth={1}
        borderRadius={"$4"}
        padding={"$2"}
        borderColor={"$gray10"}
      >
        <Input
          size={"$3"}
          value={searchText}
          onChangeText={setSearchText}
          backgroundColor={"$colorTransparent"}
          borderWidth={"$0"}
          flex={1}
          placeholder={`Seach`}
        />
        <Search marginRight={"$2"} />
      </XStack>
      <YStack width={"100%"} gap="$2">
        {filteredTokenList.map((x) => {
          return (
            <CustomListItem
              key={x.id}
              padded
              bordered
              width={"100%"}
              borderRadius={"$4"}
              onPress={() => {
                setViewAsset(x);
                setPage(Page.Asset);
              }}
              icon={
                <Avatar size="$4" circular>
                  <AvatarImage
                    source={{
                      uri: x.content?.links?.image,
                    }}
                  />
                </Avatar>
              }
              title={x.content?.metadata.name}
              subTitle={`${
                (x.token_info?.balance || 0) /
                10 ** (x.token_info?.decimals || 0)
              } ${x.content?.metadata.symbol}`}
            />
          );
        })}
      </YStack>
    </YStack>
  );
};
