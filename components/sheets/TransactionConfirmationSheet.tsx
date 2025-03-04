import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  Check,
  CircleCheck,
  Clock,
  TriangleAlert,
} from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import { CustomButton } from "components/CustomButton";
import { CustomListItem } from "components/CustomListItem";
import { useTransactionConfirmation } from "components/hooks";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import {
  ButtonText,
  Checkbox,
  Heading,
  Sheet,
  Spinner,
  Text,
  useWindowDimensions,
  XStack,
  YGroup,
  YStack,
} from "tamagui";
import {
  getSignerTypeFromAddress,
  logError,
  nfcCore,
  SignerState,
  SignerType,
  TransactionResult,
  TransactionSigner,
  useBuildAndSendTransaction,
  useGlobalStore,
  WalletInfo,
} from "utils";

export const TransactionConfirmationSheet: FC = () => {
  const {
    transactionSheetArgs,
    setTransactionSheetArgs,
    setIsNfcSheetVisible,
    setError,
    deviceWalletPublicKey,
    cloudWalletPublicKey,
  } = useGlobalStore();
  const {
    walletAddress,
    theme,
    callback,
    error,
    walletInfo,
    signers,
    tx,
    ixs,
    feePayer,
    lookUpTables,
    escrowConfig,
    changeConfig,
  } = transactionSheetArgs ?? {};

  const { height } = useWindowDimensions();
  const {
    handleMultiWalletGenericTransaction,
    handleMultiWalletChangeConfigTransaction,
    handleMultiWalletEscrowTransaction,
    handleNonMultiWalletTransaction,
  } = useTransactionConfirmation();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionResult | null>(
    null
  );
  const toast = useToastController();

  const reset = useCallback(
    async (signature?: string) => {
      if (!signature && !error) {
        toast.show("Transaction Cancelled!", {
          customData: { preset: "error" },
        });
      }
      if (Platform.OS === "android") setIsNfcSheetVisible(false);
      await nfcCore.close();
      setTransactionSheetArgs(null);
      callback?.(signature);
      setTransactions(null);
      setLoading(true);
    },
    [error, callback, nfcCore]
  );
  const isSingleSigner = useCallback(
    (walletInfo: WalletInfo | undefined): boolean => {
      return (
        !!walletInfo?.members &&
        walletInfo.threshold === walletInfo.members.length
      );
    },
    []
  );

  const handleTransactionPreparation = useCallback(async () => {
    try {
      let transactionResult: TransactionResult | null = null;
      if (tx && signers && feePayer) {
        transactionResult = {
          feePayer,
          data: [
            {
              id: "Execute Transaction",
              signers,
              feePayer,
              tx,
            },
          ],
          totalFees: 0,
        };
      } else if (signers && ixs) {
        transactionResult = await handleNonMultiWalletTransaction({
          signers,
          lookUpTables,
          feePayer,
          ixs,
        });
      } else if (isSingleSigner(walletInfo)) {
        const singleSigner =
          walletInfo?.members.map((member) => ({
            key: member.pubkey,
            state: SignerState.Unsigned,
            type: getSignerTypeFromAddress(
              {
                pubkey: member.pubkey,
                createKey: walletInfo.createKey,
              },
              deviceWalletPublicKey,
              cloudWalletPublicKey
            ),
          })) || [];

        if (ixs) {
          transactionResult = await handleMultiWalletGenericTransaction({
            signers: singleSigner,
            walletAddress,
            feePayer,
            ixs,
            lookUpTables,
          });
        } else if (escrowConfig) {
          transactionResult = await handleMultiWalletEscrowTransaction({
            signers: singleSigner,
            walletAddress,
            feePayer,
            escrowConfig,
          });
        } else if (changeConfig) {
          transactionResult = await handleMultiWalletChangeConfigTransaction({
            signers: singleSigner,
            walletAddress,
            feePayer,
            changeConfig,
          });
        }
      }
      if (transactionResult) {
        setTransactions(transactionResult);
      }
    } catch (error) {
      logError(error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, [
    signers,
    walletAddress,
    feePayer,
    ixs,
    lookUpTables,
    escrowConfig,
    walletInfo,
    changeConfig,
    deviceWalletPublicKey,
    cloudWalletPublicKey,
    handleNonMultiWalletTransaction,
    handleMultiWalletGenericTransaction,
  ]);

  useEffect(() => {
    if (loading && !!transactionSheetArgs) {
      handleTransactionPreparation();
    }
  }, [loading, transactionSheetArgs, handleTransactionPreparation]);

  const renderConfirmation = useMemo(() => {
    if (loading) {
      return (
        <XStack justify="center" items="center" gap="$2">
          <Spinner />
          <Text>{"Loading..."}</Text>
        </XStack>
      );
    }
    if (transactions) {
      return <ConfirmationState reset={reset} transactions={transactions} />;
    }
    if (walletInfo && walletInfo.threshold < walletInfo.members.length) {
      return <SelectSignersState setTransactions={setTransactions} />;
    } else {
      return (
        <XStack justify="center" items="center" gap="$2">
          <Text>{"Transaction error."}</Text>
        </XStack>
      );
    }
  }, [walletInfo, loading, transactions]);

  return (
    <Sheet
      dismissOnOverlayPress={false}
      dismissOnSnapToBottom
      modal={true}
      open={!!transactionSheetArgs}
      onOpenChange={(open) => {
        if (!open) {
          reset();
        }
      }}
      snapPoints={[90]}
      zIndex={200_000}
      animation="medium"
      snapPointsMode={"percent"}
    >
      <Sheet.Overlay
        animation="medium"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        opacity={0.5}
      />
      <Sheet.Handle theme={theme || "accent"} />
      <Sheet.Frame theme={theme || "accent"}>
        <Sheet.ScrollView
          showsVerticalScrollIndicator={false}
          width={"100%"}
          height={"100%"}
          contentContainerStyle={{
            grow: 1,
            pt: 16,
            px: 16,
            pb: Math.round(height * 0.15),
          }}
        >
          <YStack
            enterStyle={{ opacity: 0, y: -25 }}
            animation={"quick"}
            gap={"$4"}
          >
            <Text
              numberOfLines={1}
              text="center"
              fontSize={"$7"}
              fontWeight={800}
            >
              {error
                ? "Transaction Failed"
                : loading
                ? "Preparing Transaction"
                : transactions
                ? `Sending Transaction`
                : `Select Signers`}
            </Text>

            {renderConfirmation}
            <CustomButton width="100%" onPress={() => reset()}>
              <ButtonText>{error ? "Back" : "Cancel"}</ButtonText>
            </CustomButton>
            {error && (
              <YStack items="center" justify="center" width={"100%"}>
                <Text color="red">{error}</Text>
              </YStack>
            )}
          </YStack>
        </Sheet.ScrollView>
      </Sheet.Frame>
    </Sheet>
  );
};

const SelectSignersState: FC<{
  setTransactions: React.Dispatch<
    React.SetStateAction<TransactionResult | null>
  >;
}> = ({ setTransactions }) => {
  const [selectedSigners, setSelectedSigners] = useState<TransactionSigner[]>();
  const {
    transactionSheetArgs,
    setError,
    deviceWalletPublicKey,
    cloudWalletPublicKey,
  } = useGlobalStore();
  const {
    walletAddress,
    walletInfo,
    ixs,
    feePayer,
    lookUpTables,
    escrowConfig,
    changeConfig,
  } = transactionSheetArgs ?? {};
  const {
    handleMultiWalletGenericTransaction,
    handleMultiWalletChangeConfigTransaction,
    handleMultiWalletEscrowTransaction,
  } = useTransactionConfirmation();
  const [loading, setLoading] = useState(false);

  const preSelectedSigners = useMemo(() => {
    return (
      walletInfo?.members
        .map((x) => {
          const type = getSignerTypeFromAddress(
            {
              pubkey: x.pubkey,
              createKey: walletInfo.createKey,
            },
            deviceWalletPublicKey,
            cloudWalletPublicKey
          );
          if (
            type === SignerType.DEVICE ||
            type === SignerType.CLOUD ||
            (walletInfo.members.length === 1 && type === SignerType.NFC)
          ) {
            return {
              state: SignerState.Unsigned,
              key: x.pubkey,
              type,
            };
          } else {
            return null;
          }
        })
        .filter((x) => !!x) || []
    );
  }, [walletInfo, deviceWalletPublicKey, cloudWalletPublicKey]);

  useEffect(() => {
    if (!selectedSigners) setSelectedSigners(preSelectedSigners);
  }, [selectedSigners, preSelectedSigners]);

  const handleConfirm = useCallback(async () => {
    try {
      if (
        !(
          selectedSigners &&
          walletInfo &&
          walletInfo.threshold <= selectedSigners.length
        )
      )
        throw new Error("Not enough signers selected.");
      setLoading(true);
      let transactionResult: TransactionResult | null = null;
      if (ixs) {
        transactionResult = await handleMultiWalletGenericTransaction({
          signers: selectedSigners,
          walletAddress,
          feePayer,
          ixs,
          lookUpTables,
        });
      } else if (escrowConfig) {
        transactionResult = await handleMultiWalletEscrowTransaction({
          signers: selectedSigners,
          walletAddress,
          feePayer,
          escrowConfig,
        });
      } else if (changeConfig) {
        transactionResult = await handleMultiWalletChangeConfigTransaction({
          signers: selectedSigners,
          walletAddress,
          feePayer,
          changeConfig,
        });
      }
      if (transactionResult) {
        setTransactions(transactionResult);
      }
    } catch (error) {
      logError(error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, [
    walletInfo,
    selectedSigners,
    walletAddress,
    feePayer,
    ixs,
    escrowConfig,
    changeConfig,
    lookUpTables,
  ]);

  return (
    <>
      <Heading size="$2">{`Number of Signers Required: ${
        selectedSigners?.length || 0
      } / ${walletInfo?.threshold || 0}`}</Heading>
      <YGroup>
        {walletInfo?.members.map((x) => {
          const type = getSignerTypeFromAddress(
            {
              pubkey: x.pubkey,
              createKey: walletInfo.createKey,
            },
            deviceWalletPublicKey,
            cloudWalletPublicKey
          );
          return (
            <YGroup.Item key={x.pubkey}>
              <CustomListItem
                bordered
                padded
                title={x.pubkey}
                subTitle={type}
                iconAfter={
                  <Checkbox
                    defaultChecked={
                      type === SignerType.DEVICE ||
                      type === SignerType.CLOUD ||
                      (walletInfo.members.length === 1 &&
                        type === SignerType.NFC)
                    }
                    onCheckedChange={(e) => {
                      if (e.valueOf()) {
                        setSelectedSigners((prev) =>
                          prev
                            ? prev.findIndex((y) => y.key === x.pubkey) === -1
                              ? [
                                  ...prev,
                                  {
                                    key: x.pubkey,
                                    type: type,
                                    state: SignerState.Unsigned,
                                  },
                                ]
                              : prev
                            : undefined
                        );
                      } else {
                        setSelectedSigners((prev) =>
                          prev?.filter((y) => y.key !== x.pubkey)
                        );
                      }
                    }}
                    size={"$6"}
                  >
                    <Checkbox.Indicator>
                      <Check />
                    </Checkbox.Indicator>
                  </Checkbox>
                }
              />
            </YGroup.Item>
          );
        })}
      </YGroup>
      <CustomButton
        width={"100%"}
        disabled={
          loading &&
          selectedSigners &&
          walletInfo &&
          walletInfo.threshold > selectedSigners.length
        }
        onPress={handleConfirm}
      >
        {loading && <Spinner />}
        <ButtonText>{"Continue"}</ButtonText>
      </CustomButton>
    </>
  );
};

const ConfirmationState: FC<{
  transactions: TransactionResult;
  reset: (signature?: string) => Promise<void>;
}> = ({ transactions, reset }) => {
  const {
    transactionSheetArgs,
    setError,
    setIsNfcSheetVisible,
    cloudStorage,
    walletSheetArgs,
  } = useGlobalStore();
  const { error, walletAddress } = transactionSheetArgs ?? {};
  const { type } = walletSheetArgs ?? {};
  const buildAndSendTransactionMutation = useBuildAndSendTransaction({
    walletAddress,
    cloudStorage,
    setIsNfcSheetVisible,
    type,
  });
  const toast = useToastController();
  const [confirmedSigners, setConfirmedSigners] = useState<
    { key: string; type: SignerType; state: SignerState; id: string }[]
  >(
    transactions.data.flatMap((x) =>
      x.signers.flatMap((y) => ({ id: x.id, ...y }))
    )
  );
  const sendTransaction = useCallback(async () => {
    buildAndSendTransactionMutation
      .mutateAsync({
        ...transactions,
        callback: (data) => {
          setConfirmedSigners((prev) =>
            prev.map((x) => (x.id === data.id && x.key === data.key ? data : x))
          );
        },
      })
      .then((sig) => {
        if (sig) {
          toast.show("Transaction Success!", {
            customData: { preset: "success" },
          });
          reset(sig);
        }
      })
      .catch((error) => {
        setError(error instanceof Error ? error.message : String(error));
      });
  }, [transactions]);
  return (
    <>
      <Heading size="$2">Getting Required Signatures</Heading>
      <YGroup>
        {confirmedSigners?.map((x) => (
          <YGroup.Item key={`${x.key}-${x.id}`}>
            <CustomListItem
              bordered
              padded
              title={x.key}
              subTitle={`${x.type} - ${x.id}`}
              icon={
                <Text>
                  {x.state === SignerState.Signed
                    ? "Signed"
                    : x.state === SignerState.Unsigned
                    ? "Awaiting"
                    : "Error"}
                </Text>
              }
              iconAfter={
                x.state === SignerState.Signed ? (
                  <CircleCheck size={"$1"} color={"green"} />
                ) : x.state === SignerState.Unsigned ? (
                  <Clock size={"$1"} />
                ) : (
                  <TriangleAlert size={"$1"} color="red" />
                )
              }
            />
          </YGroup.Item>
        ))}
      </YGroup>
      <YStack items="flex-end" justify="center" width={"100%"}>
        {!!transactions.totalFees && (
          <Text fontSize={"$1"}>{`Network Fee: ${
            transactions.totalFees / LAMPORTS_PER_SOL
          } SOL`}</Text>
        )}
      </YStack>
      {!error && buildAndSendTransactionMutation.isPending && (
        <XStack items="center" width={"100%"} justify={"center"} gap="$2">
          <Spinner />
          <Text>{`${
            confirmedSigners?.every((x) => x.state === SignerState.Signed)
              ? "Sending transaction in progress"
              : "Fetching signatures in progress"
          }`}</Text>
        </XStack>
      )}
      <CustomButton
        disabled={buildAndSendTransactionMutation.isPending || !!error}
        onPress={sendTransaction}
      >
        Confirm
      </CustomButton>
    </>
  );
};
