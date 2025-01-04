import { PublicKey } from "@solana/web3.js";
import { CustomButton } from "components/CustomButton";
import { FC } from "react";
import { Image, YStack } from "tamagui";
import { Page } from "utils/enums/page";
import { SignerType } from "utils/enums/transaction";
import { getMultiSigFromAddress, getVaultFromAddress } from "utils/helper";
import { useGetAssetsByOwner } from "utils/queries/useGetAssetsByOwner";
import { useGetWalletInfo } from "utils/queries/useGetWalletInfo";
import { DAS } from "utils/types/das";

export const CollectiblesTab: FC<{
  type: SignerType;
  walletAddress: PublicKey;
  setViewAsset: React.Dispatch<
    React.SetStateAction<DAS.GetAssetResponse | undefined>
  >;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
}> = ({ type, walletAddress, setViewAsset, setPage }) => {
  const { data: walletInfo } = useGetWalletInfo({
    address:
      type === SignerType.NFC ? getMultiSigFromAddress(walletAddress) : null,
  });
  const { data: allAssets } = useGetAssetsByOwner({
    address: walletInfo ? getVaultFromAddress(walletAddress) : walletAddress,
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
            !(x.interface == "FungibleToken" || x.interface == "FungibleAsset")
        )
        .map((x) => {
          return (
            <CustomButton
              padded={false}
              key={x.id}
              width="45%"
              aspectRatio={1}
              justifyContent="center"
              alignItems="center"
              borderRadius="$4"
              padding={0}
              onPress={() => {
                setViewAsset(x);
                setPage(Page.Asset);
              }}
            >
              <Image
                borderRadius={"$4"}
                height={"100%"}
                width={"100%"}
                objectFit="contain"
                source={{ uri: x?.content?.links?.image }}
                alt="image"
              />
            </CustomButton>
          );
        })}
    </YStack>
  );
};
