import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { ArrowLeft, AtSign } from "@tamagui/lucide-icons";
import { useOnboarding } from "components/providers/onboardingProvider";
import { FC, useMemo, useState } from "react";
import { Pressable } from "react-native";
import {
  Avatar,
  AvatarImage,
  Button,
  ButtonIcon,
  ButtonText,
  Form,
  Heading,
  Input,
  Spinner,
  Text,
  XStack,
  YStack,
} from "tamagui";
import { Page } from "utils/enums/wallet";
import { getVaultFromAddress } from "utils/helper";
import { useCreateVaultExecuteIxMutation } from "utils/mutations/createVaultExecuteIx";
import { SignerType } from "utils/program/transactionBuilder";
import { DAS } from "utils/types/das";
import { SignerState, TransactionArgs } from "utils/types/transaction";

export const Withdrawal: FC<{
  walletAddress: PublicKey;
  asset: DAS.GetAssetResponse;
  walletInfo:
    | {
        createKey: PublicKey;
        threshold: number;
        bump: number;
        members: PublicKey[];
      }
    | null
    | undefined;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  setWithdrawAsset: React.Dispatch<
    React.SetStateAction<DAS.GetAssetResponse | undefined>
  >;

  setArgs: React.Dispatch<React.SetStateAction<TransactionArgs | null>>;
}> = ({
  walletAddress,
  asset,
  walletInfo,
  setPage,
  setWithdrawAsset,
  setArgs,
}) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const createVaultExecuteIxMutation = useCreateVaultExecuteIxMutation({
    wallet: walletAddress,
  });

  const { deviceAddress, cloudAddress } = useOnboarding();

  const isOwner = useMemo(
    () =>
      walletInfo?.members.findIndex(
        (x) => deviceAddress?.toString() == x.toString()
      ) !== -1,
    [walletInfo]
  );
  return (
    <YStack gap={"$4"} alignItems="center">
      <XStack
        gap={"$4"}
        padding="$2"
        justifyContent="space-between"
        alignItems="center"
        width={"100%"}
      >
        <Pressable
          onPress={() => {
            setPage(Page.Main);
            setWithdrawAsset(undefined);
          }}
        >
          <ArrowLeft />
        </Pressable>
        <Heading>{`Transfer ${asset.content?.metadata.name}`}</Heading>
        <ArrowLeft opacity={0} />
      </XStack>
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
            <Button circular theme="active" size={"$3"}>
              <ButtonIcon children={<AtSign size={"$1"} />} />
            </Button>
          </XStack>
          {(asset?.interface === "FungibleToken" ||
            asset?.interface === "FungibleAsset") && (
            <YStack gap="$1">
              <XStack
                alignItems="center"
                borderWidth={1}
                borderRadius={"$4"}
                padding={"$2"}
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
                  theme="active"
                  size={"$3"}
                >
                  <ButtonText>Max</ButtonText>
                </Button>
              </XStack>
              <XStack justifyContent="flex-end">
                <Text className="w-full text-right">
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
              theme="active"
              onPress={async () => {
                const feePayer =
                  isOwner && deviceAddress
                    ? {
                        key: deviceAddress,
                        type: SignerType.DEVICE,
                        state: SignerState.Unsigned,
                      }
                    : {
                        key: walletAddress,
                        type: SignerType.NFC,
                        state: SignerState.Unsigned,
                      };

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
                    : [
                        {
                          key: walletAddress,
                          type: SignerType.NFC,
                          state: SignerState.Unsigned,
                        },
                      ];
                const tokenProgram = new PublicKey(
                  asset.token_info?.token_program!
                );
                const vaultAddress = getVaultFromAddress({
                  address: walletAddress,
                });
                const destination = getAssociatedTokenAddressSync(
                  new PublicKey(asset.id),
                  new PublicKey(recipient),
                  true,
                  tokenProgram
                );
                const ataIx = createAssociatedTokenAccountIdempotentInstruction(
                  new PublicKey(feePayer.key),
                  destination,
                  new PublicKey(recipient),
                  new PublicKey(asset.id),
                  tokenProgram
                );
                const transferIx = createTransferCheckedInstruction(
                  getAssociatedTokenAddressSync(
                    new PublicKey(asset.id),
                    vaultAddress,
                    true,
                    tokenProgram
                  ),
                  new PublicKey(asset.id),
                  destination,
                  vaultAddress,
                  parseFloat(amount) * 10 ** (asset.token_info?.decimals || 0),
                  asset.token_info?.decimals || 0,
                  undefined,
                  tokenProgram
                );
                const vaultTransactionExecute =
                  await createVaultExecuteIxMutation.mutateAsync({
                    feePayer: feePayer,
                    signers: signers,
                    ixs: [transferIx],
                  });

                if (vaultTransactionExecute) {
                  setArgs({
                    feePayer,
                    signers,
                    ixs: [
                      ataIx,
                      vaultTransactionExecute.vaultTransactionExecuteIx,
                    ],
                    lookUpTables: vaultTransactionExecute.lookupTableAccounts,
                  });
                  setPage(Page.Confirmation);
                }
              }}
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
