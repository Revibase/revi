import { PublicKey } from "@solana/web3.js";
import { Send } from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { CustomListItem } from "components/CustomListItem";
import { useValidateWallet } from "components/hooks/useValidateWallet";
import { FC, useMemo } from "react";
import { Alert } from "react-native";
import {
  Avatar,
  AvatarImage,
  ButtonIcon,
  ButtonText,
  Card,
  Heading,
  Text,
  XGroup,
  XStack,
  YStack,
} from "tamagui";
import { Page } from "utils/enums/page";
import { WalletType } from "utils/enums/wallet";
import { formatAmount } from "utils/helper";
import { useGetAsset } from "utils/queries/useGetAsset";
import { DAS } from "utils/types/das";
import { Header } from "./header";

export const AssetPage: FC<{
  type: WalletType;
  walletAddress: PublicKey;
  asset: DAS.GetAssetResponse;
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
}> = ({ type, walletAddress, asset, setPage, setWithdrawAsset }) => {
  return (
    <YStack
      enterStyle={{ opacity: 0, x: -25 }}
      animation={"quick"}
      gap="$6"
      padding={"$4"}
    >
      <Header
        text={asset.content?.metadata.name || ""}
        reset={() => setPage(Page.Main)}
      />
      <Asset
        type={type}
        walletAddress={walletAddress}
        asset={asset}
        setPage={setPage}
        setWithdrawAsset={setWithdrawAsset}
      />
    </YStack>
  );
};
export const Asset: FC<{
  type: WalletType;
  walletAddress: PublicKey;
  asset: DAS.GetAssetResponse;
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
  callback?: () => void;
}> = ({
  type,
  walletAddress,
  asset,
  setPage,
  setWithdrawAsset,
  callback = () => setPage(Page.Asset),
}) => {
  const { data: collection } = useGetAsset({
    mint: asset?.grouping?.find((x) => x.group_key == "collection")?.group_value
      ? new PublicKey(
          asset?.grouping?.find(
            (x) => x.group_key == "collection"
          )?.group_value!
        )
      : undefined,
  });
  const {
    deviceWalletPublicKeyIsMember,
    cloudWalletPublicKeyIsMember,
    validateAction,
  } = useValidateWallet(walletAddress, type);

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
    <YStack width={"100%"} gap={"$6"} alignItems="center">
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
        {assetBalance > 0 && (
          <CustomButton
            onPress={() => {
              if (!validateAction()) return;
              if (
                !(
                  asset.compression?.compressed &&
                  (!deviceWalletPublicKeyIsMember ||
                    !cloudWalletPublicKeyIsMember)
                )
              ) {
                setWithdrawAsset({ asset, callback });
                setPage(Page.Withdrawal);
              } else {
                Alert.alert(
                  "Unauthorised action",
                  "An owner needs to be set first."
                );
              }
            }}
          >
            <ButtonText>Send</ButtonText>
            <ButtonIcon children={<Send size={"$1"} />} />
          </CustomButton>
        )}
      </XStack>
      {(asset?.interface === "FungibleToken" ||
        asset?.id === PublicKey.default.toString()) && (
        <XGroup
          width={"100%"}
          alignItems="center"
          justifyContent="center"
          size={"$4"}
          alignSelf="center"
        >
          <XGroup.Item>
            <CustomListItem
              width={"33%"}
              title={`${formatAmount(assetBalance)} ${
                asset.content?.metadata.symbol
              }`}
              subTitle={"Amount"}
            />
          </XGroup.Item>

          <XGroup.Item>
            <CustomListItem
              width={"33%"}
              title={`$${formatAmount(assetPrice || 0)}`}
              subTitle={"Price"}
            />
          </XGroup.Item>

          <XGroup.Item>
            <CustomListItem
              width={"33%"}
              title={`$${formatAmount(total)}`}
              subTitle={"Total"}
            />
          </XGroup.Item>
        </XGroup>
      )}
      <YStack gap="$4">
        {asset?.content?.metadata.description && (
          <>
            <Heading>{"Description"}</Heading>
            <Text>{asset?.content?.metadata.description}</Text>
          </>
        )}

        {asset?.content?.metadata.attributes &&
          asset.content.metadata.attributes.length > 0 && (
            <>
              <Heading>{"Attributes"}</Heading>
              <YStack gap="$2" flexDirection="row" flexWrap="wrap">
                {asset?.content?.metadata.attributes?.map((x, index) => {
                  return (
                    <CustomListItem
                      key={index}
                      width={"30%"}
                      title={x.value}
                      subTitle={x.trait_type}
                      bordered
                      padding={"$2"}
                      borderRadius={"$2"}
                    />
                  );
                })}
              </YStack>
            </>
          )}
        {collection && (
          <Card size="$4" bordered padded gap={"$3"}>
            <XStack alignItems="center" gap={"$3"}>
              <Avatar size={"$3"} circular>
                <AvatarImage
                  source={{ uri: collection.content?.links?.image }}
                />
              </Avatar>
              <Heading size={"$3"}>{collection.content?.metadata.name}</Heading>
            </XStack>
            <Text>{collection.content?.metadata.description}</Text>
          </Card>
        )}
      </YStack>
    </YStack>
  );
};
