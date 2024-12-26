import { PublicKey } from "@solana/web3.js";
import { ArrowLeft, Search } from "@tamagui/lucide-icons";
import { FC, useMemo, useState } from "react";
import {
  Avatar,
  AvatarImage,
  Button,
  Input,
  ListItem,
  Text,
  XStack,
  YStack,
} from "tamagui";
import { SOL_NATIVE_MINT } from "utils/consts";
import { SignerType } from "utils/enums/transaction";
import { Page } from "utils/enums/wallet";
import { getMultiSigFromAddress, getVaultFromAddress } from "utils/helper";
import { useGetAssetsByOwner } from "utils/queries/useGetAssetsByOwner";
import { useGetWalletInfo } from "utils/queries/useGetWalletInfo";
import { DAS } from "utils/types/das";

export const SearchPage: FC<{
  type: SignerType;
  walletAddress: PublicKey;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  setViewAsset: React.Dispatch<
    React.SetStateAction<DAS.GetAssetResponse | undefined>
  >;
}> = ({ type, walletAddress, setPage, setViewAsset }) => {
  const { data: walletInfo } = useGetWalletInfo({
    address:
      type === SignerType.NFC ? getMultiSigFromAddress(walletAddress) : null,
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
    <YStack width={"100%"} padding={"$4"} gap="$4">
      <XStack
        width={"100%"}
        padding="$2"
        justifyContent="space-between"
        alignItems="center"
      >
        <Button
          backgroundColor={"$colorTransparent"}
          onPress={() => setPage && setPage(Page.Main)}
        >
          <ArrowLeft />
        </Button>
        <Text
          numberOfLines={1}
          width={"70%"}
          textAlign="center"
          fontSize={"$8"}
          fontWeight={800}
        >{`Tokens`}</Text>
        <Button opacity={0}>
          <ArrowLeft />
        </Button>
      </XStack>
      <XStack alignItems="center" gap="$4">
        <Input
          value={searchText}
          onChangeText={setSearchText}
          flex={1}
          placeholder={`Seach`}
        />
        <Search marginRight="$2" />
      </XStack>
      <YStack width={"100%"} gap="$2">
        {filteredTokenList.map((x) => {
          return (
            <ListItem
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
