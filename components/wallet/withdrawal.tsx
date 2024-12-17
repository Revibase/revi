import { PublicKey } from "@solana/web3.js";
import { ArrowLeft, AtSign } from "@tamagui/lucide-icons";
import { useConnection } from "components/providers/connectionProvider";
import { useGlobalVariables } from "components/providers/globalProvider";
import { FC, useState } from "react";
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
import { SignerType } from "utils/enums/transaction";
import { Page } from "utils/enums/wallet";
import { getVaultFromAddress } from "utils/helper";
import { useCreateVaultExecuteIxMutation } from "utils/mutations/createVaultExecuteIx";
import { transferAsset } from "utils/transfer";
import { DAS } from "utils/types/das";
import { SignerState, TransactionArgs } from "utils/types/transaction";

export const Withdrawal: FC<{
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
}> = ({ asset, walletInfo, setPage, setWithdrawAsset, setArgs }) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const createVaultExecuteIxMutation = useCreateVaultExecuteIxMutation({
    wallet: walletInfo?.createKey,
  });

  const { deviceAddress, cloudAddress } = useGlobalVariables();
  const { connection } = useConnection();
  return (
    <YStack gap={"$8"} alignItems="center">
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
          {asset.token_info?.supply !== 1 && (
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
              onPress={async () => {
                if (!walletInfo) {
                  return;
                }
                try {
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
                          (x) =>
                            x.toString() === walletInfo.createKey.toString()
                        )
                      ? [
                          {
                            key: walletInfo.createKey,
                            type: SignerType.NFC,
                            state: SignerState.Unsigned,
                          },
                        ]
                      : null;
                  if (!signers) {
                    throw new Error("Signer can't be found.");
                  }

                  let { ixs, lookUpTables } = await transferAsset(
                    connection,
                    getVaultFromAddress(walletInfo.createKey),
                    new PublicKey(recipient),
                    asset.token_info?.supply === 1 ? 1 : parseFloat(amount),
                    asset.id === PublicKey.default.toString(),
                    asset
                  );

                  const vaultTransactionExecute =
                    await createVaultExecuteIxMutation.mutateAsync({
                      signers: signers,
                      ixs: ixs,
                      lookUpTables,
                    });
                  if (vaultTransactionExecute) {
                    ixs = [vaultTransactionExecute.vaultTransactionExecuteIx];
                    lookUpTables = vaultTransactionExecute.lookupTableAccounts;
                  }

                  setArgs({
                    signers,
                    ixs,
                    lookUpTables,
                    microLamports: vaultTransactionExecute?.microLamports,
                    units: vaultTransactionExecute?.units,
                    totalFees: vaultTransactionExecute?.totalFees,
                  });
                  setPage(Page.Confirmation);
                } catch (e) {
                  console.log(e);
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
