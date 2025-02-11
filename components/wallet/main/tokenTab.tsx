import { getVaultFromAddress } from "@revibase/multi-wallet";
import { PublicKey } from "@solana/web3.js";
import { ArrowDown, ArrowUpRight } from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { CustomListItem } from "components/CustomListItem";
import { useWalletInfo } from "components/hooks";
import { Image } from "expo-image";
import { FC } from "react";
import { Avatar, ButtonIcon, Text, XStack, YStack } from "tamagui";
import {
  formatAmount,
  Page,
  proxify,
  SOL_NATIVE_MINT,
  useGetAssetsByOwner,
  useGlobalStore,
} from "utils";

export const TokenTab: FC = () => {
  const { walletSheetArgs, setPage, setAsset } = useGlobalStore();
  const { type, walletAddress } = walletSheetArgs ?? {};
  const { walletInfo } = useWalletInfo({
    walletAddress,
    type,
  });

  const { data: allAssets } = useGetAssetsByOwner({
    address:
      walletInfo && walletAddress
        ? getVaultFromAddress(new PublicKey(walletAddress)).toString()
        : walletAddress,
  });
  const nativeAsset = SOL_NATIVE_MINT(allAssets?.nativeBalance);

  return (
    <YStack items="center" gap="$8" flex={1} width={"100%"}>
      <XStack items="center" gap="$6">
        <YStack gap="$2" items="center" justify="center">
          <CustomButton
            bordered
            circular
            onPress={() => {
              setPage(Page.Deposit);
            }}
          >
            <ButtonIcon children={<ArrowDown size={"$2"} />} />
          </CustomButton>
          <Text>Deposit</Text>
        </YStack>
        <YStack gap="$2" items="center" justify="center">
          <CustomButton
            bordered
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
      <YStack width={"100%"} gap="$1.5">
        <CustomListItem
          bordered
          width={"100%"}
          borderTopLeftRadius={"$4"}
          borderTopRightRadius={"$4"}
          borderBottomLeftRadius={"$4"}
          borderBottomRightRadius={"$4"}
          onPress={() => {
            setAsset(nativeAsset);
            setPage(Page.Asset);
          }}
          icon={
            <Avatar size="$4" circular>
              {nativeAsset.content?.links?.image && (
                <Image
                  style={{ height: "100%", width: "100%" }}
                  source={{
                    uri: proxify(nativeAsset.content?.links?.image),
                  }}
                />
              )}
            </Avatar>
          }
          title={nativeAsset.content?.metadata.name}
          subTitle={`${
            (nativeAsset.token_info?.balance || 0) /
            10 ** (nativeAsset.token_info?.decimals || 0)
          } ${nativeAsset.content?.metadata.symbol}`}
          iconAfter={
            <Text numberOfLines={1}>
              {`$${formatAmount(
                (nativeAsset.token_info?.price_info?.price_per_token || 0) *
                  ((nativeAsset.token_info?.balance || 0) /
                    10 ** (nativeAsset.token_info?.decimals || 0))
              )}`}
            </Text>
          }
        />
        {allAssets?.items
          .filter(
            (x) =>
              x.interface == "FungibleToken" || x.interface == "FungibleAsset"
          )
          .map((x) => {
            return (
              <CustomListItem
                key={x.id}
                bordered
                width={"100%"}
                borderTopLeftRadius={"$4"}
                borderTopRightRadius={"$4"}
                borderBottomLeftRadius={"$4"}
                borderBottomRightRadius={"$4"}
                onPress={() => {
                  setAsset(x);
                  setPage(Page.Asset);
                }}
                icon={
                  <Avatar size="$4" circular>
                    {x.content?.links?.image && (
                      <Image
                        style={{ height: "100%", width: "100%" }}
                        source={{
                          uri: proxify(x.content?.links?.image),
                        }}
                      />
                    )}
                  </Avatar>
                }
                title={x.content?.metadata.name}
                subTitle={`${
                  (x.token_info?.balance || 0) /
                  10 ** (x.token_info?.decimals || 0)
                } ${x.content?.metadata.symbol}`}
                iconAfter={
                  <Text numberOfLines={1}>
                    {`$${formatAmount(
                      (x.token_info?.price_info?.price_per_token || 0) *
                        ((x.token_info?.balance || 0) /
                          10 ** (x.token_info?.decimals || 0))
                    )}`}
                  </Text>
                }
              />
            );
          })}
      </YStack>
    </YStack>
  );
};
