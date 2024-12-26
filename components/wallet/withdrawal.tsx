import { PublicKey } from "@solana/web3.js";
import { ArrowLeft, AtSign } from "@tamagui/lucide-icons";
import { useConnection } from "components/providers/connectionProvider";
import { useGlobalVariables } from "components/providers/globalProvider";
import { FC, useCallback, useMemo, useState } from "react";
import {
  Avatar,
  AvatarImage,
  Button,
  ButtonIcon,
  ButtonText,
  Form,
  Input,
  Text,
  XStack,
  YStack,
} from "tamagui";
import { SignerType } from "utils/enums/transaction";
import { Page } from "utils/enums/wallet";
import { getMultiSigFromAddress, getVaultFromAddress } from "utils/helper";
import { transferAsset } from "utils/program/transfer";
import { useGetWalletInfo } from "utils/queries/useGetWalletInfo";
import { DAS } from "utils/types/das";
import { SignerState, TransactionArgs } from "utils/types/transaction";

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

  const { primaryAddress, secondaryAddress } = useGlobalVariables();
  const { connection } = useConnection();
  const asset = withdrawal.asset;
  const hasOnlyOne = useMemo(() => {
    return (
      asset.token_info?.supply === 1 || asset.compression?.compressed === true
    );
  }, [asset]);

  const handleWithdrawal = useCallback(() => {
    if (!walletInfo) {
      return;
    }

    transferAsset(
      connection,
      type === SignerType.NFC
        ? getVaultFromAddress(walletAddress)
        : walletAddress,
      new PublicKey(recipient),
      hasOnlyOne ? 1 : parseFloat(amount),
      asset.id === PublicKey.default.toString(),
      asset
    )
      .then(async (result) => {
        if (type === SignerType.NFC) {
          setArgs({
            callback: () => setPage(Page.Withdrawal),
            walletInfo,
            ixs: result.ixs,
            lookUpTables: result.lookUpTables,
          });
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
      })
      .catch((e) => {
        console.log(e);
      });
  }, [asset, walletInfo, primaryAddress, secondaryAddress, recipient]);

  return (
    <YStack gap={"$8"} padding={"$4"} alignItems="center">
      <XStack
        padding="$2"
        justifyContent="space-between"
        alignItems="center"
        width={"100%"}
      >
        <Button
          backgroundColor={"$colorTransparent"}
          onPress={() => {
            if (withdrawal.callback) {
              withdrawal.callback();
            } else {
              setPage(Page.Main);
              setWithdrawAsset(undefined);
            }
          }}
        >
          <ArrowLeft />
        </Button>
        <Text
          numberOfLines={1}
          width={"70%"}
          textAlign="center"
          fontSize={"$8"}
          fontWeight={800}
        >{`Send ${asset.content?.metadata.name}`}</Text>
        <Button opacity={0}>
          <ArrowLeft />
        </Button>
      </XStack>
      <Avatar size={"$16"} circular>
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
              value={recipient}
              onChangeText={setRecipient}
              borderWidth={0}
              flex={1}
              backgroundColor={"transparent"}
              placeholder="Recipient's Solana PublicKey"
            />
            <Button circular size={"$3"}>
              <ButtonIcon children={<AtSign size={"$1"} />} />
            </Button>
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
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Amount"
                  inputMode="numeric"
                  flex={1}
                  backgroundColor={"transparent"}
                  borderWidth={0}
                />
                <Button
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
                </Button>
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
            <Button onPress={handleWithdrawal}>
              <ButtonText fontSize={"$6"} fontWeight={"600"}>
                Confirm
              </ButtonText>
            </Button>
          </Form.Trigger>
        </Form>
      </YStack>
    </YStack>
  );
};
