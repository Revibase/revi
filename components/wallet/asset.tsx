import { getVaultFromAddress } from "@revibase/multi-wallet";
import { DAS } from "@revibase/token-transfer";
import { PublicKey } from "@solana/web3.js";
import { ArrowUpDown, Copy, Send } from "@tamagui/lucide-icons";
import {
  useCopyToClipboard,
  usePendingOffers,
  useWallet,
  useWalletValidation,
} from "components/hooks";
import { useAssetValidation } from "components/hooks/useAssetValidation";
import { CustomButton } from "components/ui/CustomButton";
import { CustomListItem } from "components/ui/CustomListItem";
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
import { formatAmount, Page, proxify, useGlobalStore } from "utils";
import { BlinksPage } from "./blinks";
import { ScreenWrapper } from "./screenWrapper";

export const AssetPage: FC = () => {
  const { setPage, walletSheetArgs, setAsset } = useGlobalStore();
  const { asset, callback } = walletSheetArgs ?? {};
  const copyToClipBoard = useCopyToClipboard();
  return (
    <ScreenWrapper
      text={asset?.content?.metadata.name || ""}
      reset={() => {
        if (callback) {
          callback();
        } else {
          setPage(Page.Main);
          setAsset(undefined);
        }
      }}
      rightIcon={
        !!asset?.id &&
        asset.id !== PublicKey.default.toString() && (
          <CustomButton
            bg={"$colorTransparent"}
            size={"$3"}
            onPress={() => copyToClipBoard(asset.id)}
          >
            <Copy />
          </CustomButton>
        )
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

  const collection = asset?.grouping?.find(
    (x) => x.group_key == "collection"
  )?.collection_metadata;

  const { theme, walletAddress, type } = walletSheetArgs ?? {};
  const {
    deviceWalletPublicKeyIsMember,
    paymasterWalletPublicKeyIsMember,
    walletInfo,
    noOwners,
  } = useWallet({ theme, walletAddress, type });

  const { hasPendingOffers } = usePendingOffers({ type, walletAddress });
  const validateAction = useWalletValidation({
    hasPendingOffers,
    walletInfo,
    noOwners,
    deviceWalletPublicKeyIsMember,
    paymasterWalletPublicKeyIsMember,
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
      <XStack width={"100%"} items="center" justify="center" gap="$2">
        <CustomButton
          bordered
          onPress={() => {
            if (!validateAction()) return;
            if (
              asset?.compression?.compressed &&
              !deviceWalletPublicKeyIsMember &&
              !paymasterWalletPublicKeyIsMember
            ) {
              Alert.alert(
                "Unauthorised action",
                "An owner needs to be set first."
              );
            } else if (
              !hasAsset(
                asset,
                vaultAddress,
                noOwners,
                deviceWalletPublicKeyIsMember,
                paymasterWalletPublicKeyIsMember,
                type
              )
            ) {
              Alert.alert(
                `${asset?.content?.metadata.name} not found.`,
                `Ensure you have ${asset?.content?.metadata.name} in your wallet.`
              );
            } else if (asset) {
              setAsset(asset, callback || (() => setPage(Page.Asset)));
              setPage(Page.Withdrawal);
            }
          }}
        >
          <Text fontSize={"$5"}>Send</Text>
          <ButtonIcon children={<Send size={"$1"} />} />
        </CustomButton>
        {(asset?.token_info?.supply ?? 0) > 1 && (
          <CustomButton
            bordered
            onPress={() => {
              setAsset(asset, callback || (() => setPage(Page.Asset)));
              setPage(Page.Swap);
            }}
          >
            <Text fontSize={"$5"}>Swap</Text>
            <ButtonIcon children={<ArrowUpDown size={"$1"} />} />
          </CustomButton>
        )}
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
              {collection.image && (
                <Avatar size={"$3"} circular>
                  <Image
                    style={{ height: "100%", width: "100%" }}
                    source={{
                      uri: proxify(collection.image),
                    }}
                  />
                </Avatar>
              )}
              <Heading size={"$2"}>{collection.name}</Heading>
            </XStack>
            <Text>{collection.description}</Text>
          </Card>
        )}
        <BlinksPage />
      </YStack>
    </YStack>
  );
};
