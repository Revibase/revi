import { getVaultFromAddress } from "@revibase/multi-wallet";
import { DAS } from "@revibase/token-transfer";
import { PublicKey } from "@solana/web3.js";
import { Send, Star } from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { CustomListItem } from "components/CustomListItem";
import {
  useCopyToClipboard,
  usePendingOffers,
  useWallet,
  useWalletValidation,
} from "components/hooks";
import { useAssetValidation } from "components/hooks/useAssetValidation";
import { Image } from "expo-image";
import { FC, useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  Avatar,
  ButtonIcon,
  Card,
  Heading,
  Text,
  XGroup,
  XStack,
  YStack,
} from "tamagui";
import {
  formatAmount,
  Page,
  proxify,
  useGetAsset,
  useGlobalStore,
} from "utils";
import { ScreenWrapper } from "./screenWrapper";

export const AssetPage: FC = () => {
  const { setPage, walletSheetArgs } = useGlobalStore();
  const { asset } = walletSheetArgs ?? {};
  const copyToClipBoard = useCopyToClipboard();
  return (
    <ScreenWrapper
      text={asset?.content?.metadata.name || ""}
      reset={() => setPage(Page.Main)}
      copy={
        asset?.id && asset.id !== PublicKey.default.toString()
          ? () => copyToClipBoard(asset.id)
          : undefined
      }
    >
      <YStack items="center" gap="$4">
        {asset?.content?.links?.image && (
          <Avatar size={"$20"} borderRadius={"$4"}>
            <Image
              style={{ height: "100%", width: "100%" }}
              source={{ uri: proxify(asset?.content?.links?.image) }}
              alt="image"
            />
          </Avatar>
        )}
        <Asset asset={asset} />
      </YStack>
    </ScreenWrapper>
  );
};
export const Asset: FC<{
  asset: DAS.GetAssetResponse | undefined | null;
  callback?: () => void;
}> = ({ asset, callback }) => {
  const { setPage, setAsset, walletSheetArgs } = useGlobalStore();
  const [parentWidth, setParentWidth] = useState(0);

  const { data: collection } = useGetAsset({
    mint: asset?.grouping?.find((x) => x.group_key == "collection")?.group_value
      ? asset?.grouping?.find((x) => x.group_key == "collection")?.group_value
      : undefined,
  });
  const { theme, walletAddress, type } = walletSheetArgs ?? {};
  const {
    deviceWalletPublicKeyIsMember,
    cloudWalletPublicKeyIsMember,
    walletInfo,
    noOwners,
  } = useWallet({ theme, walletAddress, type });

  const { hasPendingOffers } = usePendingOffers({ type, walletAddress });
  const validateAction = useWalletValidation({
    hasPendingOffers,
    walletInfo,
    noOwners,
    deviceWalletPublicKeyIsMember,
    cloudWalletPublicKeyIsMember,
  });
  const { hasAsset } = useAssetValidation();
  const vaultAddress = walletAddress
    ? getVaultFromAddress(new PublicKey(walletAddress)).toString()
    : null;
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
    <YStack width={"100%"} gap={"$6"} items="center">
      <XStack width={"100%"} items="center" justify="center" gap="$4">
        <CustomButton
          bordered
          onPress={() => {
            if (!validateAction()) return;
            if (
              asset?.compression?.compressed &&
              !deviceWalletPublicKeyIsMember &&
              !cloudWalletPublicKeyIsMember
            ) {
              Alert.alert(
                "Unauthorised action",
                "An owner needs to be set first."
              );
            } else if (
              !hasAsset(
                asset,
                vaultAddress,
                deviceWalletPublicKeyIsMember,
                cloudWalletPublicKeyIsMember,
                type
              )
            ) {
              Alert.alert(
                `${asset?.content?.metadata.name} not found.`,
                `Ensure you have ${asset?.content?.metadata.name} in your wallet.`
              );
            } else if (asset) {
              setAsset(asset, callback || (() => setPage(Page.Main)));
              setPage(Page.Withdrawal);
            }
          }}
        >
          <Text fontSize={"$5"}>Send</Text>
          <ButtonIcon children={<Send size={"$1"} />} />
        </CustomButton>

        <CustomButton
          onPress={() => {
            if (!validateAction()) return;
            if (
              !hasAsset(
                asset,
                vaultAddress,
                deviceWalletPublicKeyIsMember,
                cloudWalletPublicKeyIsMember,
                type
              )
            ) {
              Alert.alert(
                `${asset?.content?.metadata.name} not found.`,
                `Ensure you have ${asset?.content?.metadata.name} in your wallet.`
              );
            } else if (asset) {
              setAsset(asset, callback || (() => setPage(Page.Main)));
              setPage(Page.BlinksPage);
            }
          }}
          bordered
        >
          <Text fontSize={"$5"}>Blinks</Text>
          <ButtonIcon children={<Star size={"$1"} />} />
        </CustomButton>
      </XStack>
      {!!assetBalance && (
        <XGroup width={"100%"} items="center" justify="center" size={"$4"}>
          <XGroup.Item>
            <CustomListItem
              bordered
              width={"33%"}
              title={`${formatAmount(
                assetBalance,
                asset?.token_info?.decimals
              )} ${asset?.content?.metadata.symbol}`}
              subTitle={"Amount"}
            />
          </XGroup.Item>

          <XGroup.Item>
            <CustomListItem
              bordered
              width={"33%"}
              title={`$${formatAmount(assetPrice || 0)}`}
              subTitle={"Price"}
            />
          </XGroup.Item>

          <XGroup.Item>
            <CustomListItem
              bordered
              width={"33%"}
              title={`$${formatAmount(total)}`}
              subTitle={"Total"}
            />
          </XGroup.Item>
        </XGroup>
      )}
      <YStack gap="$4" width={"100%"}>
        {asset?.content?.metadata.description && (
          <>
            <Heading size={"$5"}>{"Description"}</Heading>
            <Text>{asset?.content?.metadata.description}</Text>
          </>
        )}

        {asset?.content?.metadata.attributes &&
          asset.content.metadata.attributes.length > 0 && (
            <>
              <Heading size={"$5"}>{"Attributes"}</Heading>
              <YStack
                width={"100%"}
                gap="$2"
                flexDirection="row"
                flexWrap="wrap"
                onLayout={(e) => setParentWidth(e.nativeEvent.layout.width)}
              >
                {asset?.content?.metadata.attributes?.map((x, index) => {
                  return (
                    <CustomListItem
                      key={index}
                      width={(parentWidth - 16) / 3}
                      title={x.value}
                      subTitle={x.trait_type}
                      bordered
                      p={"$2"}
                      borderTopLeftRadius={"$4"}
                      borderTopRightRadius={"$4"}
                      borderBottomLeftRadius={"$4"}
                      borderBottomRightRadius={"$4"}
                    />
                  );
                })}
              </YStack>
            </>
          )}
        {collection && (
          <Card size="$4" bordered padded gap={"$3"}>
            <XStack items="center" gap={"$3"}>
              {collection.content?.links?.image && (
                <Avatar size={"$3"} circular>
                  <Image
                    style={{ height: "100%", width: "100%" }}
                    source={{
                      uri: proxify(collection.content?.links?.image),
                    }}
                  />
                </Avatar>
              )}
              <Heading size={"$2"}>{collection.content?.metadata.name}</Heading>
            </XStack>
            <Text>{collection.content?.metadata.description}</Text>
          </Card>
        )}
      </YStack>
    </YStack>
  );
};
