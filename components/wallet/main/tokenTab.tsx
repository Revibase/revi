import { PublicKey } from "@solana/web3.js";
import { ArrowDown, ArrowUpRight } from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import { CustomButton } from "components/CustomButton";
import { FC } from "react";
import {
  Avatar,
  AvatarImage,
  ButtonIcon,
  ListItem,
  Text,
  XStack,
  YStack,
} from "tamagui";
import { SOL_NATIVE_MINT } from "utils/consts";
import { Page } from "utils/enums/page";
import { SignerType } from "utils/enums/transaction";
import { getMultiSigFromAddress, getVaultFromAddress } from "utils/helper";
import { useGetAssetsByOwner } from "utils/queries/useGetAssetsByOwner";
import { useGetWalletInfo } from "utils/queries/useGetWalletInfo";
import { DAS } from "utils/types/das";

export const TokenTab: FC<{
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
  const nativeAsset = SOL_NATIVE_MINT(allAssets?.nativeBalance);
  const toast = useToastController();
  return (
    <YStack alignItems="center" gap="$8" flex={1} width={"100%"}>
      <XStack alignItems="center" gap="$6">
        <YStack gap="$2" alignItems="center" justifyContent="center">
          <CustomButton
            circular
            onPress={() => {
              setPage(Page.Deposit);
            }}
          >
            <ButtonIcon children={<ArrowDown size={"$2"} />} />
          </CustomButton>
          <Text>Deposit</Text>
        </YStack>
        <YStack gap="$2" alignItems="center" justifyContent="center">
          <CustomButton
            onPress={() => {
              setPage(Page.Search);
            }}
            circular
          >
            <ButtonIcon children={<ArrowUpRight size={"$2"} />} />
          </CustomButton>
          <Text>Withdraw</Text>
        </YStack>
      </XStack>
      <YStack width={"100%"} gap="$2">
        <ListItem
          padded
          bordered
          width={"100%"}
          borderRadius={"$4"}
          hoverStyle={{ scale: 0.925 }}
          pressStyle={{ scale: 0.925 }}
          animation="bouncy"
          hoverTheme
          pressTheme
          onPress={() => {
            setViewAsset(nativeAsset);
            setPage(Page.Asset);
          }}
          icon={
            <Avatar size="$4" circular>
              <AvatarImage
                source={{
                  uri: nativeAsset.content?.links?.image,
                }}
              />
            </Avatar>
          }
          title={nativeAsset.content?.metadata.name}
          subTitle={`${
            (nativeAsset.token_info?.balance || 0) /
            10 ** (nativeAsset.token_info?.decimals || 0)
          } ${nativeAsset.content?.metadata.symbol}`}
          iconAfter={
            <YStack maxWidth={"25%"}>
              <Text numberOfLines={1}>
                {`$${
                  (nativeAsset.token_info?.price_info?.price_per_token || 0) *
                  ((nativeAsset.token_info?.balance || 0) /
                    10 ** (nativeAsset.token_info?.decimals || 0))
                }`}
              </Text>
            </YStack>
          }
        />
        {allAssets?.items
          .filter(
            (x) =>
              x.interface == "FungibleToken" || x.interface == "FungibleAsset"
          )
          .map((x) => {
            return (
              <ListItem
                key={x.id}
                padded
                bordered
                hoverStyle={{ scale: 0.925 }}
                pressStyle={{ scale: 0.925 }}
                animation="bouncy"
                hoverTheme
                pressTheme
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
                iconAfter={
                  <YStack maxWidth={"25%"}>
                    <Text numberOfLines={1}>
                      {`$${
                        (x.token_info?.price_info?.price_per_token || 0) *
                        ((x.token_info?.balance || 0) /
                          10 ** (x.token_info?.decimals || 0))
                      }`}
                    </Text>
                  </YStack>
                }
              />
            );
          })}
      </YStack>
    </YStack>
  );
};
