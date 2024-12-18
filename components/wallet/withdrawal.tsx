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
  Spinner,
  Text,
  XStack,
  YStack,
} from "tamagui";
import { SignerType } from "utils/enums/transaction";
import { Page } from "utils/enums/wallet";
import { getMultiSigFromAddress, getVaultFromAddress } from "utils/helper";
import { useCreateVaultExecuteIxMutation } from "utils/mutations/createVaultExecuteIx";
import { transferAsset } from "utils/program/transfer";
import { useGetWalletInfo } from "utils/queries/useGetWalletInfo";
import { DAS } from "utils/types/das";
import { SignerState, TransactionArgs } from "utils/types/transaction";

export const Withdrawal: FC<{
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
}> = ({ withdrawal, walletAddress, setPage, setWithdrawAsset, setArgs }) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const { data: walletInfo } = useGetWalletInfo({
    address: getMultiSigFromAddress(walletAddress),
  });
  const createVaultExecuteIxMutation = useCreateVaultExecuteIxMutation({
    wallet: walletAddress,
  });
  const { deviceAddress, cloudAddress } = useGlobalVariables();
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
    const isOwner =
      walletInfo.members.findIndex(
        (x) => deviceAddress?.toString() == x.toString()
      ) !== -1;
    const signers =
      isOwner && deviceAddress && cloudAddress
        ? [
            {
              key: deviceAddress,
              type: SignerType.DEVICE,
              state: SignerState.Unsigned,
            },
            {
              key: cloudAddress,
              type: SignerType.CLOUD,
              state: SignerState.Unsigned,
            },
          ]
        : walletInfo.members.every(
            (x) => x.toString() === walletAddress.toString()
          )
        ? [
            {
              key: walletAddress,
              type: SignerType.NFC,
              state: SignerState.Unsigned,
            },
          ]
        : null;
    if (!signers) {
      throw new Error("Signer can't be found.");
    }

    transferAsset(
      connection,
      getVaultFromAddress(walletAddress),
      new PublicKey(recipient),
      hasOnlyOne ? 1 : parseFloat(amount),
      asset.id === PublicKey.default.toString(),
      asset
    )
      .then((result) => {
        createVaultExecuteIxMutation
          .mutateAsync({
            signers: signers,
            ixs: result.ixs,
            lookUpTables: result.lookUpTables,
          })
          .then((response) => {
            if (response) {
              setArgs({
                callback: () => setPage(Page.Withdrawal),
                signers,
                ixs: [response.vaultTransactionExecuteIx],
                lookUpTables: response.lookupTableAccounts,
                microLamports: response.microLamports,
                units: response.units,
                totalFees: response.totalFees,
              });
              setPage(Page.Confirmation);
            }
          })
          .catch((e) => {
            console.log(e);
          });
      })
      .catch((e) => {
        console.log(e);
      });
  }, [asset, walletInfo, deviceAddress, cloudAddress, recipient]);

  return (
    <YStack gap={"$8"} alignItems="center">
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
            <Button
              disabled={createVaultExecuteIxMutation.isPending}
              onPress={handleWithdrawal}
            >
              <ButtonText fontSize={"$6"} fontWeight={"600"}>
                Confirm
              </ButtonText>
              {createVaultExecuteIxMutation.isPending && <Spinner />}
            </Button>
          </Form.Trigger>
        </Form>
      </YStack>
    </YStack>
  );
};
