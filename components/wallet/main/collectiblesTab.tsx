import { getVaultFromAddress } from "@revibase/multi-wallet";
import { PublicKey } from "@solana/web3.js";
import { useWalletInfo } from "components/hooks";
import { CustomButton } from "components/ui/CustomButton";
import { Image } from "expo-image";
import { FC } from "react";
import { YStack } from "tamagui";
import { Page, proxify, useGetAssetsByOwner, useGlobalStore } from "utils";

export const CollectiblesTab: FC = () => {
  const { walletSheetArgs, setPage, setAsset } = useGlobalStore();
  const { type, walletAddress } = walletSheetArgs ?? {};
  const { walletInfo } = useWalletInfo({ walletAddress, type });

  const { data: allAssets } = useGetAssetsByOwner({
    address:
      walletInfo && walletAddress
        ? getVaultFromAddress(new PublicKey(walletAddress)).toString()
        : walletAddress,
  });
  return (
    <YStack
      flex={1}
      width={"100%"}
      flexWrap="wrap" // Allow items to wrap within the container
      flexDirection="row" // Make the children flow in rows
      gap="$4" // Spacing between grid items
    >
      {allAssets?.items
        .filter(
          (x) =>
            !(
              x.interface == "FungibleToken" || x.interface == "FungibleAsset"
            ) && !!x?.content?.links?.image
        )
        .map((x) => {
          return (
            <CustomButton
              padded={false}
              key={x.id}
              width="45%"
              aspectRatio={1}
              justify="center"
              items="center"
              borderTopLeftRadius={"$4"}
              borderTopRightRadius={"$4"}
              borderBottomLeftRadius={"$4"}
              borderBottomRightRadius={"$4"}
              p={0}
              onPress={() => {
                setAsset(x);
                setPage(Page.Asset);
              }}
            >
              <Image
                style={{ borderRadius: 16, height: "100%", width: "100%" }}
                contentFit="cover"
                source={{
                  uri: proxify(x?.content?.links?.image!),
                }}
              />
            </CustomButton>
          );
        })}
    </YStack>
  );
};
