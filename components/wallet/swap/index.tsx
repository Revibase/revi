import { getVaultFromAddress } from "@revibase/multi-wallet";
import { DAS } from "@revibase/token-transfer";
import { PublicKey } from "@solana/web3.js";
import { useSwap } from "components/hooks";
import { CustomButton } from "components/ui/CustomButton";
import { CustomListItem } from "components/ui/CustomListItem";
import { Image } from "expo-image";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  ButtonText,
  Card,
  Input,
  Spinner,
  Text,
  useTheme,
  XStack,
  YGroup,
  YStack,
} from "tamagui";
import {
  debounce,
  formatAmount,
  Page,
  proxify,
  SOL_NATIVE_MINT,
  USDC_MINT,
  useGetAssetsByOwner,
  useGlobalStore,
  WalletType,
} from "utils";
import { ScreenWrapper } from "../screenWrapper";
import { InputTokenList } from "./inputTokenList";
import { OutputTokenList } from "./outputTokenList";

export const SwapPage: FC = () => {
  const { setPage, walletSheetArgs, setAsset, setSwapAsset } = useGlobalStore();
  const { asset, swapAsset } = walletSheetArgs ?? {};
  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const { quote, getQuote, setQuote, confirmSwap, isLoading } = useSwap();
  const { type, walletAddress } = walletSheetArgs ?? {};
  const { color } = useTheme();
  const { data: allAssets } = useGetAssetsByOwner({
    address:
      type === WalletType.MULTIWALLET && walletAddress
        ? getVaultFromAddress(new PublicKey(walletAddress)).toString()
        : walletAddress,
  });
  useEffect(() => {
    if (!asset || asset.id === PublicKey.default.toString()) {
      setAsset({
        ...SOL_NATIVE_MINT(allAssets?.nativeBalance),
        id: "So11111111111111111111111111111111111111112",
      });
    }
    if (!swapAsset) {
      setSwapAsset(
        allAssets?.items.find((x) => x.id === USDC_MINT().id) ?? USDC_MINT()
      );
    }
  }, [allAssets, asset, swapAsset]);

  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchQuote = useCallback(async () => {
    if (!inputAmount) {
      setOutputAmount("");
      setQuote(undefined);
      return;
    }
    if (!asset || !swapAsset || isLoading) return;
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    const currentRequestId = ++requestIdRef.current;

    const response = await getQuote(
      "ExactIn",
      inputAmount,
      asset,
      swapAsset,
      controller.signal
    );

    if (currentRequestId === requestIdRef.current) {
      setOutputAmount(response);
    }
  }, [inputAmount, asset, swapAsset, isLoading]);

  const debouncedFetchQuote = useMemo(
    () => debounce(fetchQuote, 500),
    [fetchQuote]
  );

  useEffect(() => {
    debouncedFetchQuote();
    intervalRef.current = setInterval(fetchQuote, 15000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      debouncedFetchQuote.cancel();
    };
  }, [debouncedFetchQuote, fetchQuote]);

  return (
    <ScreenWrapper text={"Swap Tokens"} reset={() => setPage(Page.Main)}>
      <YStack gap={"$4"} items={"center"} flex={1}>
        <CardComponent
          asset={asset}
          amount={inputAmount}
          setAmount={setInputAmount}
          type="Input"
          isLoading={isLoading}
        />
        <CardComponent
          asset={swapAsset}
          amount={outputAmount}
          type="Output"
          isLoading={isLoading}
        />
        {quote && (
          <YGroup>
            <YGroup.Item>
              <CustomListItem
                title={"Swap Routes"}
                subTitle={quote?.routePlan
                  ?.map((x) => `${x.swapInfo.label}: ${x.percent.toFixed(2)}%`)
                  .join(", ")}
              />
            </YGroup.Item>
            <YGroup.Item>
              <CustomListItem
                title={"Estimated Output"}
                iconAfter={
                  <Text>
                    {`${formatAmount(
                      parseFloat(quote?.outAmount || "0") /
                        10 ** (swapAsset?.token_info?.decimals ?? 0)
                    )} ${swapAsset?.content?.metadata?.symbol || ""}`}
                  </Text>
                }
              />
            </YGroup.Item>
            <YGroup.Item>
              <CustomListItem
                title={"Slippage"}
                iconAfter={<Text>{`${(quote?.slippageBps || 0) / 100}%`}</Text>}
              />
            </YGroup.Item>
            <YGroup.Item>
              <CustomListItem
                title={"Fees"}
                iconAfter={
                  <Text>{`${(quote?.platformFee?.feeBps || 0) / 100}%`}</Text>
                }
              />
            </YGroup.Item>
            <YGroup.Item>
              <CustomListItem
                title={"Price Impact"}
                iconAfter={
                  <Text
                    color={
                      parseFloat(quote.priceImpactPct) > 5 ? "orange" : color
                    }
                  >
                    {formatAmount(parseFloat(quote.priceImpactPct))}%
                  </Text>
                }
              />
            </YGroup.Item>
          </YGroup>
        )}
        <CustomButton
          disabled={!quote || isLoading}
          onPress={confirmSwap}
          width={"100%"}
        >
          {isLoading && <Spinner />}
          <ButtonText>Review Order</ButtonText>
        </CustomButton>
      </YStack>
    </ScreenWrapper>
  );
};

const CardComponent: FC<{
  asset: DAS.GetAssetResponse | undefined | null;
  amount: string;
  setAmount?: (value: string) => void;
  type: "Input" | "Output";
  isLoading: boolean;
}> = ({ amount, asset, setAmount, type, isLoading }) => {
  const { setGenericSheetArgs, walletSheetArgs } = useGlobalStore();

  return (
    <Card width={"100%"} padded bordered gap={"$2"}>
      <Text>{type === "Input" ? "You Pay" : "You Receive"}</Text>
      {asset && (
        <XStack
          justify="flex-end"
          onPress={() =>
            !!setAmount &&
            setAmount(
              (
                (asset?.token_info?.balance || 0) /
                10 ** (asset?.token_info?.decimals || 0)
              ).toString()
            )
          }
        >
          <Text fontSize={"$1"}>
            {`Available: ${
              (asset?.token_info?.balance || 0) /
              10 ** (asset?.token_info?.decimals || 0)
            } ${asset?.content?.metadata?.symbol}`}
          </Text>
        </XStack>
      )}
      <XStack
        items="center"
        borderWidth={1}
        borderTopLeftRadius={"$4"}
        borderTopRightRadius={"$4"}
        borderBottomLeftRadius={"$4"}
        borderBottomRightRadius={"$4"}
        p={"$2"}
        borderColor={"$borderColor"}
        bg={"$background"}
      >
        <Input
          size={"$3"}
          value={amount}
          onChangeText={setAmount}
          inputMode="decimal"
          flex={1}
          bg={"transparent"}
          placeholder={type === "Input" ? "Enter amount" : "Receive Amount"}
          disabled={type === "Output" || isLoading}
          borderWidth={0}
        />
        <CustomButton
          variant="outlined"
          borderTopLeftRadius={"$8"}
          borderTopRightRadius={"$8"}
          borderBottomLeftRadius={"$8"}
          borderBottomRightRadius={"$8"}
          onPress={() => {
            setGenericSheetArgs({
              snapPoints: [70],
              title: "Select Token",
              body: type === "Input" ? <InputTokenList /> : <OutputTokenList />,
              actionText: "",
              onPress: function (): void {
                throw new Error("Function not implemented.");
              },
              theme: walletSheetArgs?.theme || "accent",
            });
          }}
          size={"$3"}
        >
          {asset?.content?.links?.image && (
            <Avatar size="$1" circular>
              <Image
                style={{ height: "100%", width: "100%" }}
                source={{
                  uri: proxify(asset.content.links.image),
                }}
              />
            </Avatar>
          )}
          <ButtonText numberOfLines={1} fontWeight={600}>
            {asset?.content?.metadata.name ?? "Select Token"}
          </ButtonText>
        </CustomButton>
      </XStack>
    </Card>
  );
};
