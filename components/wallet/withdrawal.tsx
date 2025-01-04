import { PublicKey } from "@solana/web3.js";
import { AtSign } from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import { CustomButton } from "components/CustomButton";
import { useConnection } from "components/providers/connectionProvider";
import { useGlobalVariables } from "components/providers/globalProvider";
import { FC, useCallback, useMemo, useState } from "react";
import {
  Avatar,
  AvatarImage,
  ButtonIcon,
  ButtonText,
  Form,
  Input,
  Text,
  XStack,
  YStack,
} from "tamagui";
import { Page } from "utils/enums/page";
import { SignerType } from "utils/enums/transaction";
import { getMultiSigFromAddress, getVaultFromAddress } from "utils/helper";
import { transferAsset } from "utils/program/transfer";
import { useGetWalletInfo } from "utils/queries/useGetWalletInfo";
import { DAS } from "utils/types/das";
import { SignerState, TransactionArgs } from "utils/types/transaction";
import { Header } from "./header";

export const Withdrawal: FC<{
  type: SignerType;
  withdrawal: {
    asset: DAS.GetAssetResponse;
    callback?: () => void;
  };
  walletAddress: PublicKey;
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
  setArgs: React.Dispatch<React.SetStateAction<TransactionArgs | null>>;
}> = ({
  type,
  withdrawal,
  walletAddress,
  setPage,
  setWithdrawAsset,
  setArgs,
}) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const { data: walletInfo } = useGetWalletInfo({
    address:
      type === SignerType.NFC ? getMultiSigFromAddress(walletAddress) : null,
  });

  const { deviceWalletPublicKey, passkeyWalletPublicKey } =
    useGlobalVariables();
  const { connection } = useConnection();
  const asset = withdrawal.asset;
  const hasOnlyOne = useMemo(() => {
    return (
      asset.token_info?.supply === 1 || asset.compression?.compressed === true
    );
  }, [asset]);
  const toast = useToastController();

  const handleWithdrawal = useCallback(async () => {
    try {
      const result = await transferAsset(
        connection,
        type === SignerType.NFC
          ? getVaultFromAddress(walletAddress)
          : walletAddress,
        new PublicKey(recipient),
        hasOnlyOne ? 1 : parseFloat(amount),
        asset.id === PublicKey.default.toString(),
        asset
      );
      if (type === SignerType.NFC) {
        if (walletInfo) {
          setArgs({
            callback: () => setPage(Page.Withdrawal),
            walletInfo,
            ixs: result.ixs,
            lookUpTables: result.lookUpTables,
          });
        }
      } else {
        setArgs({
          callback: () => setPage(Page.Withdrawal),
          signers: [
            {
              key: walletAddress,
              type: type,
              state: SignerState.Unsigned,
            },
          ],
          ixs: result.ixs,
          lookUpTables: result.lookUpTables,
        });
      }
      setPage(Page.Confirmation);
    } catch (error) {
      toast.show("Error", {
        message: error.message,
        customData: { preset: "error" },
      });
    }
  }, [
    walletAddress,
    type,
    asset,
    walletInfo,
    deviceWalletPublicKey,
    passkeyWalletPublicKey,
    recipient,
    hasOnlyOne,
    amount,
    connection,
  ]);

  return (
    <YStack
      enterStyle={{ opacity: 0, x: -25 }}
      animation={"medium"}
      gap={"$8"}
      padding={"$4"}
      alignItems="center"
    >
      <Header
        text={`Send ${asset.content?.metadata.name}`}
        reset={() => {
          if (withdrawal.callback) {
            withdrawal.callback();
          } else {
            setPage(Page.Main);
            setWithdrawAsset(undefined);
          }
        }}
      />
      <Avatar size={"$12"} circular>
        <AvatarImage
          source={{ uri: asset.content?.links?.image }}
          alt="image"
        />
      </Avatar>
      <YStack width={"100%"}>
        <Form gap="$4">
          <XStack
            borderRadius="$4"
            padding="$2"
            borderWidth={1}
            borderColor={"$gray10"}
            alignItems="center"
          >
            <Input
              size={"$3"}
              value={recipient}
              onChangeText={setRecipient}
              borderWidth={0}
              flex={1}
              backgroundColor={"transparent"}
              placeholder="Recipient's Solana Wallet Address"
            />
            <CustomButton circular size={"$3"}>
              <ButtonIcon children={<AtSign size={"$1"} />} />
            </CustomButton>
          </XStack>
          {!hasOnlyOne && (
            <YStack gap="$2">
              <XStack
                alignItems="center"
                borderWidth={1}
                borderRadius={"$4"}
                padding={"$2"}
                borderColor={"$gray10"}
              >
                <Input
                  size={"$3"}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Amount"
                  inputMode="numeric"
                  flex={1}
                  backgroundColor={"transparent"}
                  borderWidth={0}
                />
                <CustomButton
                  borderRadius={"$12"}
                  onPress={() =>
                    setAmount(
                      (
                        (asset.token_info?.balance || 0) /
                        10 ** (asset.token_info?.decimals || 0)
                      ).toString() || ""
                    )
                  }
                  size={"$3"}
                >
                  <ButtonText>Max</ButtonText>
                </CustomButton>
              </XStack>
              <XStack justifyContent="flex-end">
                <Text fontSize={"$1"} className="w-full text-right">
                  {`Available: ${
                    (asset.token_info?.balance || 0) /
                    10 ** (asset.token_info?.decimals || 0)
                  } ${asset.content?.metadata?.symbol}`}
                </Text>
              </XStack>
            </YStack>
          )}
          <Form.Trigger>
            <CustomButton themeInverse size={"$4"} onPress={handleWithdrawal}>
              <ButtonText>Confirm</ButtonText>
            </CustomButton>
          </Form.Trigger>
        </Form>
      </YStack>
    </YStack>
  );
};
