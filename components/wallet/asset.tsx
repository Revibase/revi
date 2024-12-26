import { PublicKey } from "@solana/web3.js";
import {
  ArrowLeft,
  ArrowUpDown,
  DollarSign,
  Send,
} from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import { useGlobalVariables } from "components/providers/globalProvider";
import { FC, useMemo } from "react";
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
import { SignerType } from "utils/enums/transaction";
import { Page } from "utils/enums/wallet";
import { getMultiSigFromAddress } from "utils/helper";
import { useGetAsset } from "utils/queries/useGetAsset";
import { useGetWalletInfo } from "utils/queries/useGetWalletInfo";
import { DAS } from "utils/types/das";

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
    <YStack gap="$6" padding={"$4"}>
      <Header setPage={setPage} asset={asset} />
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
  const { primaryAddress, secondaryAddress } = useGlobalVariables();
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

  const noOwners =
    !!walletInfo?.members &&
    (
      walletInfo?.members.filter(
        (x) => x.toString() !== walletAddress.toString()
      ) || []
    ).length === 0;

  const primaryAddressIsMember =
    !noOwners &&
    !!primaryAddress &&
    ((walletInfo?.members &&
      walletInfo.members.findIndex(
        (x) => x.toString() === primaryAddress.toString()
      ) !== -1) ||
      walletAddress.toString() === primaryAddress.toString());

  const secondaryAddressIsMember =
    !noOwners &&
    !!secondaryAddress &&
    ((walletInfo?.members &&
      walletInfo.members.findIndex(
        (x) => x.toString() === secondaryAddress.toString()
      ) !== -1) ||
      walletAddress.toString() === secondaryAddress.toString());

  const isAllowed = useMemo(
    () => noOwners || primaryAddressIsMember || secondaryAddressIsMember,
    [noOwners, primaryAddressIsMember, secondaryAddressIsMember]
  );

  const isNonFungible = useMemo(() => {
    return (
      asset?.token_info?.supply === 1 || asset?.compression?.compressed === true
    );
  }, [asset]);
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
        <Button
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
                  (!primaryAddressIsMember || !secondaryAddressIsMember)
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
        </Button>
        {(asset?.interface === "FungibleToken" ||
          asset?.id === PublicKey.default.toString()) && (
          <Button
            onPress={() => {
              toast.show("Feature coming soon.");
            }}
          >
            <ButtonText>Swap</ButtonText>
            <ButtonIcon children={<ArrowUpDown size={"$1"} />} />
          </Button>
        )}
        {isNonFungible && (
          <Button
            onPress={() => {
              toast.show("Feature coming soon.");
            }}
          >
            <ButtonText>Sell</ButtonText>
            <ButtonIcon children={<DollarSign size={"$1"} />} />
          </Button>
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
                      width={"32%"}
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
                ></AvatarImage>
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

const Header: FC<{
  asset: DAS.GetAssetResponse | undefined;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
}> = ({ asset, setPage }) => {
  return (
    <XStack
      padding="$2"
      justifyContent="space-between"
      alignItems="center"
      width={"100%"}
    >
      <Button
        backgroundColor={"$colorTransparent"}
        onPress={() => setPage(Page.Main)}
      >
        <ArrowLeft />
      </Button>
      <Text
        numberOfLines={1}
        width={"70%"}
        textAlign="center"
        fontSize={"$8"}
        fontWeight={800}
      >
        {asset?.content?.metadata.name}
      </Text>
      <Button opacity={0}>
        <ArrowLeft />
      </Button>
    </XStack>
  );
};
