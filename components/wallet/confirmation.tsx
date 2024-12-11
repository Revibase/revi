import { PublicKey } from "@solana/web3.js";
import {
  ArrowLeft,
  CircleCheck,
  Clock,
  TriangleAlert,
} from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import { FC, useEffect } from "react";
import { Pressable } from "react-native";
import {
  Button,
  ButtonText,
  Heading,
  ListItem,
  Text,
  XStack,
  YGroup,
  YStack,
} from "tamagui";
import { Page } from "utils/enums/wallet";
import { useBuildAndSendVaultTransaction } from "utils/mutations/buildAndSendVaultTransaction";
import { SignerType } from "utils/program/transactionBuilder";
import { SignerState, TransactionArgs } from "utils/types/transaction";

export const ConfirmationPage: FC<{
  walletAddress: PublicKey;
  args: TransactionArgs;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  setArgs: React.Dispatch<React.SetStateAction<TransactionArgs | null>>;
}> = ({ walletAddress, setPage, args, setArgs }) => {
  const toast = useToastController();
  const buildAndSendTransactionMutation = useBuildAndSendVaultTransaction({
    wallet: walletAddress,
  });
  useEffect(() => {
    if (
      !buildAndSendTransactionMutation.isPending &&
      !args.signers.some((x) => x.state === SignerState.Error)
    ) {
      buildAndSendTransactionMutation
        .mutateAsync({
          args,
          callback: (e) => {
            setArgs((prev) =>
              prev
                ? {
                    ...prev,
                    signers: prev.signers.map((x) => {
                      return x.key.toString() === e.key.toString()
                        ? { ...x, state: e.state }
                        : x;
                    }),
                  }
                : null
            );
          },
        })
        .then((sig) => {
          if (sig) {
            toast.show("Transaction Success!");
            setArgs(null);
            setPage(Page.Main);
          }
        });
    }
  }, [args]);
  return (
    <YStack gap={"$4"}>
      <XStack
        gap={"$4"}
        padding="$2"
        justifyContent="space-between"
        alignItems="center"
        width={"100%"}
      >
        <Pressable
          onPress={() => {
            setArgs(null);
            setPage(Page.Main);
            toast.show("Transaction Cancelled!");
          }}
        >
          <ArrowLeft />
        </Pressable>
        <Heading>{`Sending Transaction`}</Heading>
        <ArrowLeft opacity={0} />
      </XStack>
      <Heading size="$3">Getting Required Signatures</Heading>
      <YGroup>
        {args.signers
          .sort((a, _) => (a.type == SignerType.NFC ? -1 : 1))
          .map((x) => (
            <YGroup.Item key={x.key.toString()}>
              <ListItem
                hoverTheme
                pressTheme
                bordered
                padded
                title={x.key.toString()}
                subTitle={x.type}
                icon={
                  <Text>
                    {x.state === SignerState.Signed
                      ? "Signed"
                      : x.state === SignerState.Unsigned
                      ? "In Queue"
                      : "Error"}
                  </Text>
                }
                iconAfter={
                  x.state === SignerState.Signed ? (
                    <CircleCheck />
                  ) : x.state === SignerState.Unsigned ? (
                    <Clock />
                  ) : (
                    <TriangleAlert color="red" />
                  )
                }
              />
            </YGroup.Item>
          ))}
      </YGroup>
      <Button
        width={"100%"}
        onPress={() => {
          setArgs(null);
          setPage(Page.Main);
          toast.show("Transaction Cancelled!");
        }}
        backgroundColor={"red"}
        theme="active"
      >
        <ButtonText>Cancel</ButtonText>
      </Button>
    </YStack>
  );
};
