import { PublicKey } from "@solana/web3.js";
import { ArrowLeft, Send } from "@tamagui/lucide-icons";
import { FC, useMemo } from "react";
import { Pressable } from "react-native";
import {
  Avatar,
  AvatarImage,
  Button,
  ButtonIcon,
  ButtonText,
  Card,
  Heading,
  ListItem,
  Text,
  XGroup,
  XStack,
  YStack,
} from "tamagui";
import { Page } from "utils/enums/wallet";
import { useGetAsset } from "utils/queries/useGetAsset";
import { DAS } from "utils/types/das";

export const AssetPage: FC<{
  asset: DAS.GetAssetResponse | undefined;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  setWithdrawAsset: React.Dispatch<
    React.SetStateAction<DAS.GetAssetResponse | undefined>
  >;
}> = ({ asset, setPage, setWithdrawAsset }) => {
  const { data: collection } = useGetAsset({
    mint: asset?.grouping?.find((x) => x.group_key == "collection")?.group_value
      ? new PublicKey(
          asset?.grouping?.find(
            (x) => x.group_key == "collection"
          )?.group_value!
        )
      : undefined,
  });

  const assetBalance = useMemo(
    () =>
      (asset?.token_info?.balance || 0) /
      10 ** (asset?.token_info?.decimals || 0),
    [asset]
  );

  const assetPrice = useMemo(
    () => asset?.token_info?.price_info?.price_per_token,
    [asset]
  );

  const total = useMemo(
    () => (assetBalance && assetPrice ? assetBalance * assetPrice : 0),
    [assetBalance, assetPrice]
  );

  return (
    <YStack gap={"$6"} alignItems="center">
      <XStack
        gap={"$4"}
        padding="$2"
        justifyContent="space-between"
        alignItems="center"
        width={"100%"}
      >
        <Pressable onPress={() => setPage(Page.Main)}>
          <ArrowLeft />
        </Pressable>
        <Heading className="text-typography-900">
          {asset?.content?.metadata.name}
        </Heading>
        <ArrowLeft opacity={0} />
      </XStack>
      <Avatar size={"$20"} borderRadius={"$4"}>
        <AvatarImage
          source={{ uri: asset?.content?.links?.image }}
          alt="image"
        />
      </Avatar>
      <XStack
        width={"100%"}
        alignItems="center"
        justifyContent="center"
        gap="$4"
      >
        <Button
          onPress={() => {
            setWithdrawAsset(asset);
            setPage(Page.Withdrawal);
          }}
        >
          <ButtonText>Transfer</ButtonText>
          <ButtonIcon children={<Send />} />
        </Button>
      </XStack>
      {(asset?.interface === "FungibleToken" ||
        asset?.interface === "Custom") && (
        <XGroup
          width={"100%"}
          alignItems="center"
          justifyContent="center"
          size={"$4"}
          alignSelf="center"
        >
          <XGroup.Item>
            <ListItem
              width={"33%"}
              hoverTheme
              pressTheme
              title={`${assetBalance} ${asset.content?.metadata.symbol}`}
              subTitle={"Amount"}
            />
          </XGroup.Item>

          <XGroup.Item>
            <ListItem
              width={"33%"}
              hoverTheme
              pressTheme
              title={`$${assetPrice}`}
              subTitle={"Price"}
            />
          </XGroup.Item>

          <XGroup.Item>
            <ListItem
              width={"33%"}
              hoverTheme
              pressTheme
              title={`$${total}`}
              subTitle={"Total"}
            />
          </XGroup.Item>
        </XGroup>
      )}
      <YStack gap="$4">
        {asset?.content?.metadata.description && (
          <>
            <Heading textAlign="left">{"Description"}</Heading>
            <Text>{asset?.content?.metadata.description}</Text>
          </>
        )}
        {asset?.content?.metadata.attributes &&
          asset.content.metadata.attributes.length > 0 && (
            <>
              <Heading textAlign="left">{"Attributes"}</Heading>
              <YStack gap="$2" flexDirection="row" flexWrap="wrap">
                {asset?.content?.metadata.attributes?.map((x, index) => {
                  return (
                    <ListItem
                      key={index}
                      width={"30%"}
                      title={x.value}
                      subTitle={x.trait_type}
                      bordered
                      padded
                      borderRadius={"$4"}
                    />
                  );
                })}
              </YStack>
            </>
          )}
      </YStack>
      {collection && (
        <Card elevate size="$4" bordered padded gap={"$3"}>
          <XStack alignItems="center" gap={"$3"}>
            <Avatar size={"$3"} circular>
              <AvatarImage
                source={{ uri: collection.content?.links?.image }}
              ></AvatarImage>
            </Avatar>
            <Heading size={"$3"}>{collection.content?.metadata.name}</Heading>
          </XStack>
          <Text>{collection.content?.metadata.description}</Text>
        </Card>
      )}
    </YStack>
  );
};
