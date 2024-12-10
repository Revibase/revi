import { ArrowLeft, Send } from "@tamagui/lucide-icons";
import { FC, useMemo } from "react";
import {
  Button,
  ButtonIcon,
  ButtonText,
  Heading,
  Image,
  Separator,
  Text,
  VisuallyHidden,
  XStack,
  YStack,
} from "tamagui";
import { Page } from "utils/enums/wallet";
import { DAS } from "utils/types/das";

export const AssetPage: FC<{
  asset: DAS.GetAssetResponse | undefined;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  setWithdrawAsset: React.Dispatch<
    React.SetStateAction<DAS.GetAssetResponse | undefined>
  >;
}> = ({ asset, setPage, setWithdrawAsset }) => {
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
    <YStack>
      <XStack className="items-center justify-between w-full gap-2 p-2">
        <Button onPress={() => setPage(Page.Main)}>
          <ArrowLeft size="xl" />
        </Button>
        <Heading className="text-typography-900">
          {asset?.content?.metadata.name}
        </Heading>
        <VisuallyHidden>
          <ArrowLeft size="xl" />
        </VisuallyHidden>
      </XStack>
      <Image
        className="rounded-lg"
        source={{ uri: asset?.content?.links?.image }}
        alt="image"
      />
      <XStack className="gap-4">
        <Button
          onPress={() => {
            setWithdrawAsset(asset);
            setPage(Page.Withdrawal);
          }}
        >
          <ButtonText>Send</ButtonText>
          <ButtonIcon children={<Send />} />
        </Button>
      </XStack>
      {asset?.interface === "FungibleToken" && (
        <XStack className="justify-evenly w-full items-center bg-background-50 rounded p-2 gap-2">
          <YStack>
            <Text>Amount</Text>
            <Text>{assetBalance}</Text>
          </YStack>
          <Separator vertical={true} />
          <YStack>
            <Text>Price</Text>
            <Text>{`$${assetPrice}`}</Text>
          </YStack>
          <Separator vertical={true} />
          <YStack>
            <Text>Total</Text>
            <Text>{`$${total}`}</Text>
          </YStack>
        </XStack>
      )}
      {asset?.content?.metadata.description && (
        <>
          <Heading className="text-typography-100">Description</Heading>
          <Text className="text-center">
            {asset?.content?.metadata.description}
          </Text>
        </>
      )}
    </YStack>
  );
};
