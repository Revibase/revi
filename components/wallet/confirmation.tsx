import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  ArrowLeft,
  CircleCheck,
  Clock,
  TriangleAlert,
} from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import { FC, useEffect, useState } from "react";
import {
  Button,
  ButtonText,
  Heading,
  ListItem,
  Spinner,
  Text,
  XStack,
  YGroup,
  YStack,
} from "tamagui";
import { SignerType } from "utils/enums/transaction";
import { Page } from "utils/enums/wallet";
import { useBuildAndSendTransaction } from "utils/mutations/buildAndSendTransaction";
import { SignerState, TransactionArgs } from "utils/types/transaction";
import NfcProxy from "../../utils/apdu/index";

export const ConfirmationPage: FC<{
  walletAddress: PublicKey;
  args: TransactionArgs;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  setArgs: React.Dispatch<React.SetStateAction<TransactionArgs | null>>;
}> = ({ walletAddress, setPage, args, setArgs }) => {
  const toast = useToastController();
  const buildAndSendTransactionMutation = useBuildAndSendTransaction({
    wallet: walletAddress,
  });
  const [error, setError] = useState<string | null>(null);

  const reset = async (callback: () => void) => {
    callback();
    setError(null);
    setArgs(null);
  };

  const handleCancelled = async (callback?: () => void) => {
    if (!error) {
      toast.show("Transaction Cancelled!", {
        customData: { preset: "error" },
      });
    }
    await NfcProxy.close();
    reset(callback ? callback : () => setPage(Page.Main));
  };

  useEffect(() => {
    if (
      !buildAndSendTransactionMutation.isPending &&
      !args.signers.some((x) => x.state === SignerState.Error)
    ) {
      buildAndSendTransactionMutation
        .mutateAsync({
          ...args,
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
            toast.show("Transaction Success!", {
              customData: {
                preset: "success",
              },
            });
            reset(() => setPage(Page.Main));
          }
        })
        .catch((error) => {
          setError(error.message);
        });
    }
  }, [args]);

  return (
    <YStack gap={"$4"}>
      <XStack
        padding="$2"
        justifyContent="space-between"
        alignItems="center"
        width={"100%"}
      >
        <Button
          backgroundColor={"$colorTransparent"}
          onPress={() => handleCancelled(args.callback)}
        >
          <ArrowLeft />
        </Button>
        <Text
          numberOfLines={1}
          width={"70%"}
          textAlign="center"
          fontSize={"$8"}
          fontWeight={800}
        >{`Sending Transaction`}</Text>
        <Button opacity={0}>
          <ArrowLeft />
        </Button>
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
                    <CircleCheck color={"green"} />
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

      <YStack alignItems="flex-end" justifyContent="center" width={"100%"}>
        {args.totalFees && (
          <Text fontSize={"$1"}>{`Network Fee: ${
            args.totalFees / LAMPORTS_PER_SOL
          } SOL`}</Text>
        )}
      </YStack>

      <YStack
        gap="$4"
        alignItems="center"
        justifyContent="center"
        width={"100%"}
      >
        {!error ? (
          <>
            <Text>{`${
              args.signers.every((x) => x.state === SignerState.Signed)
                ? "Sending transaction in progress"
                : "Fetching signatures in progress"
            }`}</Text>
            <Spinner />
          </>
        ) : (
          <Text color="red">{error}</Text>
        )}
      </YStack>
      <Button width={"100%"} onPress={() => handleCancelled()}>
        <ButtonText>{error ? "Back To Home" : "Cancel"}</ButtonText>
      </Button>
    </YStack>
  );
};
