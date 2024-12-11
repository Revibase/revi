import { ArrowLeft, Search } from "@tamagui/lucide-icons";
import { FC, useMemo, useState } from "react";
import { Pressable } from "react-native";
import {
  Avatar,
  AvatarImage,
  Heading,
  Input,
  ListItem,
  XStack,
  YStack,
} from "tamagui";
import { Page } from "utils/enums/wallet";
import { DAS } from "utils/types/das";

export const SearchPage: FC<{
  allAssets: DAS.GetAssetResponseList | null | undefined;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  setViewAsset: React.Dispatch<
    React.SetStateAction<DAS.GetAssetResponse | undefined>
  >;
}> = ({ allAssets, setPage, setViewAsset }) => {
  const [searchText, setSearchText] = useState("");
  const filteredTokenList = useMemo(() => {
    return (
      allAssets?.items.filter((x) => {
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
    <YStack width={"100%"} gap="$4">
      <XStack
        gap={"$4"}
        width={"100%"}
        padding="$2"
        justifyContent="space-between"
        alignItems="center"
      >
        <Pressable onPress={() => setPage && setPage(Page.Main)}>
          <ArrowLeft />
        </Pressable>
        <Heading>{`Tokens`}</Heading>
        <ArrowLeft opacity={0} />
      </XStack>
      <XStack alignItems="center" gap="$2">
        <Input
          value={searchText}
          onChangeText={setSearchText}
          flex={1}
          placeholder={`Seach`}
        />
        <Search />
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
