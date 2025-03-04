import {
  ADDRESS_LOOK_UP_TABLE,
  getVaultFromAddress,
} from "@revibase/multi-wallet";
import { transferAsset } from "@revibase/token-transfer";
import { PublicKey } from "@solana/web3.js";
import { AtSign } from "@tamagui/lucide-icons";
import { useWalletInfo } from "components/hooks";
import { useConnection } from "components/providers/connectionProvider";
import { CustomButton } from "components/ui/CustomButton";
import { Image } from "expo-image";
import { router } from "expo-router";
import { FC, useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  Avatar,
  ButtonIcon,
  ButtonText,
  Form,
  Input,
  Spinner,
  Text,
  XStack,
  YStack,
} from "tamagui";
import {
  getSignerTypeFromWalletType,
  logError,
  Page,
  proxify,
  SignerState,
  useGetAddressLookUpTable,
  useGlobalStore,
  WalletType,
} from "utils";
import { ScreenWrapper } from "./screenWrapper";

export const Withdrawal: FC = () => {
  const {
    walletSheetArgs,
    setPage,
    setAsset,
    setTransactionSheetArgs,
    setWalletSheetArgs,
    deviceWalletPublicKey,
    paymasterWalletPublicKey,
  } = useGlobalStore();
  const { type, walletAddress, asset, callback, theme } = walletSheetArgs ?? {};
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const { data: lookUpTable } = useGetAddressLookUpTable({
    address: ADDRESS_LOOK_UP_TABLE,
  });
  const { walletInfo } = useWalletInfo({
    walletAddress,
    type,
  });
  const { connection } = useConnection();

  const withdrawalAsset = asset;
  const hasOnlyOne = useMemo(() => {
    return (
      withdrawalAsset?.token_info?.supply === 1 ||
      withdrawalAsset?.compression?.compressed === true
    );
  }, [asset]);
  const [loading, setLoading] = useState(false);

  const handleWithdrawal = useCallback(async () => {
    try {
      setLoading(true);
      if (!walletAddress) {
        throw new Error("Unable to retrieve source address");
      }
      const source =
        type === WalletType.MULTIWALLET
          ? getVaultFromAddress(new PublicKey(walletAddress)).toString()
          : walletAddress;

      const result = await transferAsset(
        connection,
        new PublicKey(source),
        new PublicKey(recipient),
        new PublicKey(source),
        hasOnlyOne ? 1 : parseFloat(amount),
        withdrawalAsset?.id === PublicKey.default.toString(),
        withdrawalAsset ?? undefined
      );

      if (type === WalletType.MULTIWALLET) {
        if (!paymasterWalletPublicKey) {
          setWalletSheetArgs(null);
          router.replace("/(tabs)/profile");
          throw new Error("You need to complete your wallet set up first.");
        }
        if (walletInfo) {
          setTransactionSheetArgs({
            feePayer: paymasterWalletPublicKey,
            theme,
            walletAddress,
            callback: (signature) =>
              signature ? setPage(Page.Main) : setPage(Page.Withdrawal),
            walletInfo,
            ixs: result,
          });
        }
      } else {
        setTransactionSheetArgs({
          feePayer: walletAddress,
          theme,
          walletAddress,
          callback: (signature) =>
            signature ? setPage(Page.Main) : setPage(Page.Withdrawal),
          signers: [
            {
              key: walletAddress,
              type: getSignerTypeFromWalletType(type),
              state: SignerState.Unsigned,
            },
          ],
          ixs: result,
          lookUpTables: lookUpTable ? [lookUpTable] : [],
        });
      }
    } catch (error) {
      logError(error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      setLoading(false);
    }
  }, [
    theme,
    walletAddress,
    type,
    asset,
    walletInfo,
    deviceWalletPublicKey,
    paymasterWalletPublicKey,
    recipient,
    hasOnlyOne,
    amount,
    connection,
  ]);

  return (
    <ScreenWrapper
      text={`Send ${withdrawalAsset?.content?.metadata.name}`}
      reset={() => {
        if (callback) {
          callback();
          setAsset(asset);
        } else {
          setPage(Page.Main);
          setAsset(undefined);
        }
      }}
    >
      <YStack items="center" gap={"$4"}>
        {withdrawalAsset?.content?.links?.image && (
          <Avatar size={"$12"} circular>
            <Image
              style={{ height: "100%", width: "100%" }}
              source={{
                uri: proxify(withdrawalAsset?.content?.links?.image),
              }}
              alt="image"
            />
          </Avatar>
        )}
        <YStack width={"100%"}>
          <Form gap="$4">
            <XStack
              borderTopLeftRadius={"$4"}
              borderTopRightRadius={"$4"}
              borderBottomLeftRadius={"$4"}
              borderBottomRightRadius={"$4"}
              p="$2"
              borderWidth={1}
              borderColor={"$borderColor"}
              bg={"$background"}
              items="center"
            >
              <Input
                size={"$3"}
                value={recipient}
                onChangeText={setRecipient}
                borderWidth={0}
                flex={1}
                bg={"transparent"}
                placeholder="Recipient's Solana Wallet Address"
              />
              <CustomButton circular size={"$3"}>
                <ButtonIcon children={<AtSign size={"$1"} />} />
              </CustomButton>
            </XStack>
            {!hasOnlyOne && (
              <YStack gap="$2">
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
                    placeholder="Amount"
                    inputMode="decimal"
                    flex={1}
                    bg={"transparent"}
                    borderWidth={0}
                  />
                  <CustomButton
                    borderTopLeftRadius={"$12"}
                    borderTopRightRadius={"$12"}
                    borderBottomLeftRadius={"$12"}
                    borderBottomRightRadius={"$12"}
                    onPress={() =>
                      setAmount(
                        (
                          (withdrawalAsset?.token_info?.balance || 0) /
                          10 ** (withdrawalAsset?.token_info?.decimals || 0)
                        ).toString() || ""
                      )
                    }
                    size={"$3"}
                  >
                    <ButtonText>Max</ButtonText>
                  </CustomButton>
                </XStack>
                <XStack justify="flex-end">
                  <Text fontSize={"$1"} className="w-full text-right">
                    {`Available: ${
                      (withdrawalAsset?.token_info?.balance || 0) /
                      10 ** (withdrawalAsset?.token_info?.decimals || 0)
                    } ${withdrawalAsset?.content?.metadata?.symbol}`}
                  </Text>
                </XStack>
              </YStack>
            )}
            <Form.Trigger>
              <CustomButton size={"$4"} onPress={handleWithdrawal}>
                {loading && <Spinner />}
                <ButtonText>Continue</ButtonText>
              </CustomButton>
            </Form.Trigger>
          </Form>
        </YStack>
      </YStack>
    </ScreenWrapper>
  );
};
