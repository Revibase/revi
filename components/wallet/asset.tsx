import { PublicKey } from "@solana/web3.js";
import { Send } from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import { CustomButton } from "components/CustomButton";
import { useGlobalVariables } from "components/providers/globalProvider";
import { FC, useMemo } from "react";
import {
  Avatar,
  AvatarImage,
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
import { Page } from "utils/enums/page";
import { SignerType } from "utils/enums/transaction";
import { getMultiSigFromAddress } from "utils/helper";
import { useGetAsset } from "utils/queries/useGetAsset";
import { useGetWalletInfo } from "utils/queries/useGetWalletInfo";
import { DAS } from "utils/types/das";
import { Header } from "./header";

export const AssetPage: FC<{
  type: SignerType;
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
      animation={"medium"}
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
  type: SignerType;
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
  const { data: walletInfo } = useGetWalletInfo({
    address:
      type === SignerType.NFC ? getMultiSigFromAddress(walletAddress) : null,
  });
  const toast = useToastController();
  const { deviceWalletPublicKey, passkeyWalletPublicKey } =
    useGlobalVariables();
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
  const noOwners = useMemo(
    () =>
      !!walletInfo?.members &&
      (
        walletInfo?.members.filter(
          (x) => x.pubkey.toString() !== walletAddress.toString()
        ) || []
      ).length === 0,
    [walletInfo, walletAddress]
  );

  const deviceWalletPublicKeyIsMember = useMemo(
    () =>
      !noOwners &&
      !!deviceWalletPublicKey &&
      ((walletInfo?.members &&
        walletInfo.members.findIndex(
          (x) => x.pubkey.toString() === deviceWalletPublicKey.toString()
        ) !== -1) ||
        walletAddress.toString() === deviceWalletPublicKey.toString()),
    [noOwners, deviceWalletPublicKey, walletInfo, walletAddress]
  );

  const passkeyWalletPublicKeyIsMember = useMemo(
    () =>
      !noOwners &&
      !!passkeyWalletPublicKey &&
      ((walletInfo?.members &&
        walletInfo.members.findIndex(
          (x) => x.pubkey.toString() === passkeyWalletPublicKey.toString()
        ) !== -1) ||
        walletAddress.toString() === passkeyWalletPublicKey.toString()),
    [noOwners, passkeyWalletPublicKey, walletInfo, walletAddress]
  );

  const isAllowed = useMemo(
    () =>
      noOwners ||
      deviceWalletPublicKeyIsMember ||
      passkeyWalletPublicKeyIsMember,
    [noOwners, deviceWalletPublicKeyIsMember, passkeyWalletPublicKeyIsMember]
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
              if (!isAllowed) {
                toast.show("Unauthorised action", {
                  message: "You are not the owner of this wallet.",
                  customData: {
                    preset: "error",
                  },
                });
              } else {
                if (
                  !(
                    asset.compression?.compressed &&
                    (!deviceWalletPublicKeyIsMember ||
                      !passkeyWalletPublicKeyIsMember)
                  )
                ) {
                  setWithdrawAsset({ asset, callback });
                  setPage(Page.Withdrawal);
                } else {
                  toast.show("Unauthorised action", {
                    message: "An owner needs to be set first.",
                    customData: {
                      preset: "error",
                    },
                  });
                }
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
                    <ListItem
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
