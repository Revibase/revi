import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  Check,
  CircleCheck,
  Clock,
  TriangleAlert,
} from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import { CustomButton } from "components/CustomButton";
import { useConnection } from "components/providers/connectionProvider";
import { useGlobalVariables } from "components/providers/globalProvider";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import {
  ButtonText,
  Checkbox,
  Heading,
  ListItem,
  Spinner,
  Text,
  XStack,
  YGroup,
  YStack,
} from "tamagui";
import { Page } from "utils/enums/page";
import { SignerType } from "utils/enums/transaction";
import { getFeePayerFromSigners, getSignerTypeFromAddress } from "utils/helper";
import { useBuildAndSendTransaction } from "utils/mutations/buildAndSendTransaction";
import { useCreateVaultExecuteIxMutation } from "utils/mutations/createVaultExecuteIx";
import { useSetOwnerIxMutation } from "utils/mutations/setOwnerIx";
import { estimateFees } from "utils/program";
import {
  SignerState,
  TransactionArgs,
  TransactionSigner,
} from "utils/types/transaction";
import NfcProxy from "../../utils/apdu/index";
import { Header } from "./header";

export const ConfirmationPage: FC<{
  walletAddress: PublicKey;
  args: TransactionArgs;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  setArgs: React.Dispatch<React.SetStateAction<TransactionArgs | null>>;
}> = ({ walletAddress, setPage, args, setArgs }) => {
  const toast = useToastController();
  const [error, setError] = useState<string | null>(null);
  const [confirmedSigners, setConfirmedSigners] = useState<
    TransactionSigner[] | null
  >(null);
  const [transaction, setTransaction] = useState<{
    totalFees: number | null;
    ixs: TransactionInstruction[];
    lookUpTables?: AddressLookupTableAccount[];
  } | null>(null);
  const { connection } = useConnection();
  const { setNfcSheetVisible, deviceWalletPublicKey, passkeyWalletPublicKey } =
    useGlobalVariables();
  const createVaultExecuteIx = useCreateVaultExecuteIxMutation({
    wallet: walletAddress,
  });
  const setOwnerIxMutation = useSetOwnerIxMutation({ wallet: walletAddress });
  const [loading, setLoading] = useState(true);

  const prepareTransaction = useCallback(
    async (ixs: TransactionInstruction[], signers: TransactionSigner[]) => {
      try {
        const { microLamports, units, totalFees } = await estimateFees(
          connection,
          ixs,
          getFeePayerFromSigners(signers),
          signers,
          args.lookUpTables
        );
        if (microLamports) {
          ixs.unshift(
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports })
          );
        }
        if (units) {
          ixs.unshift(ComputeBudgetProgram.setComputeUnitLimit({ units }));
        }
        setConfirmedSigners(signers);
        setTransaction({ ixs, lookUpTables: args.lookUpTables, totalFees });
      } catch (error) {
        setError(error.message);
      }
    },
    [connection, args.lookUpTables]
  );

  const handleConfirmation = useCallback(
    async (signers: TransactionSigner[]) => {
      try {
        let ixs = args.ixs;
        if (args.changeConfig) {
          ixs =
            (await setOwnerIxMutation.mutateAsync({
              newOwners: args.changeConfig.newOwners,
              signers,
            })) || undefined;
        }
        if (!ixs) {
          throw new Error("No instructions found.");
        }

        const estimatedResult = await createVaultExecuteIx.mutateAsync({
          signers,
          totalFees: LAMPORTS_PER_SOL * 0.000005, // rough estimate of total fee, doesn't really matter here because we are just estimating the computing units required
          ixs,
          lookUpTables: args.lookUpTables,
        });
        if (!estimatedResult) {
          throw new Error("Unable to create vault instruction!");
        }

        const { microLamports, units, totalFees } = await estimateFees(
          connection,
          [estimatedResult.ixs],
          getFeePayerFromSigners(signers),
          signers,
          estimatedResult.lookUpTables
        );
        const result = await createVaultExecuteIx.mutateAsync({
          signers,
          totalFees,
          ixs,
          lookUpTables: args.lookUpTables,
        });
        if (!result) {
          throw new Error("Unable to create vault instruction!");
        }
        ixs = [
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports }),
          result.ixs,
        ];
        if (units) {
          ixs.unshift(ComputeBudgetProgram.setComputeUnitLimit({ units }));
        }
        setConfirmedSigners(signers);
        setTransaction({ ixs, lookUpTables: result.lookUpTables, totalFees });
      } catch (error) {
        setError(error.message);
      }
    },
    [args.changeConfig, args.ixs, args.lookUpTables, connection]
  );

  useEffect(() => {
    if (!loading) return;
    if (args.signers && args.ixs && connection) {
      prepareTransaction(args.ixs, args.signers).then(() => setLoading(false));
    } else if (
      args.walletInfo?.members &&
      args.walletInfo.threshold &&
      args.walletInfo.threshold === args.walletInfo.members.length
    ) {
      handleConfirmation(
        args.walletInfo.members.map((x) => ({
          key: x.pubkey,
          state: SignerState.Unsigned,
          type: getSignerTypeFromAddress(
            x,
            deviceWalletPublicKey,
            passkeyWalletPublicKey
          ),
        }))
      ).then(() => setLoading(false));
    } else if (
      args.walletInfo?.members &&
      args.walletInfo.threshold &&
      args.walletInfo.threshold < args.walletInfo.members.length
    ) {
      setLoading(false);
    }
  }, [
    args,
    connection,
    loading,
    deviceWalletPublicKey,
    passkeyWalletPublicKey,
    handleConfirmation,
    prepareTransaction,
  ]);

  const reset = async (callback: () => void = () => setPage(Page.Main)) => {
    if (!error) {
      toast.show("Transaction Cancelled!", { customData: { preset: "error" } });
    }
    if (Platform.OS === "android") {
      setNfcSheetVisible(false);
    }
    await NfcProxy.close();
    callback();
    setError(null);
    setArgs(null);
    setTransaction(null);
  };

  const renderConfirmation = useMemo(() => {
    if (loading) {
      return (
        <XStack justifyContent="center" alignItems="center" gap="$2">
          <Spinner />
          <Text>{"Loading..."}</Text>
        </XStack>
      );
    }
    if (confirmedSigners && transaction) {
      return (
        <ConfirmationState
          reset={reset}
          confirmedSigners={confirmedSigners}
          walletAddress={walletAddress}
          error={error}
          setError={setError}
          setConfirmedSigners={setConfirmedSigners}
          transaction={transaction}
        />
      );
    }
    if (
      args.walletInfo &&
      args.walletInfo.threshold < args.walletInfo.members.length
    ) {
      return (
        <SelectSignersState
          args={args}
          handleConfirmation={handleConfirmation}
        />
      );
    }
  }, [args, confirmedSigners, error, handleConfirmation, loading, transaction]);

  return (
    <YStack
      enterStyle={{ opacity: 0, x: -25 }}
      animation={"medium"}
      gap={"$4"}
      padding={"$4"}
    >
      <Header
        text={
          error
            ? "Transaction Failed"
            : loading
            ? "Preparing Transaction"
            : confirmedSigners
            ? `Sending Transaction`
            : `Select Signers`
        }
        reset={() => reset(args.callback)}
      />
      {renderConfirmation}
      <YStack alignItems="center" justifyContent="center" width={"100%"}>
        {error && <Text color="red">{error}</Text>}
      </YStack>
      <CustomButton width="100%" onPress={() => reset(args.callback)}>
        <ButtonText>{error ? "Back To Home" : "Cancel"}</ButtonText>
      </CustomButton>
    </YStack>
  );
};

const SelectSignersState: FC<{
  args: TransactionArgs;
  handleConfirmation: (signers: TransactionSigner[]) => void;
}> = ({ args, handleConfirmation }) => {
  const [selectedSigners, setSelectedSigners] = useState<TransactionSigner[]>();
  const { deviceWalletPublicKey, passkeyWalletPublicKey } =
    useGlobalVariables();

  useEffect(() => {
    if (!selectedSigners && args.walletInfo?.members) {
      const preSelectedSigners =
        args.walletInfo.members
          .filter((x) => {
            const type = getSignerTypeFromAddress(
              x,
              deviceWalletPublicKey,
              passkeyWalletPublicKey
            );
            return (
              type === SignerType.DEVICE ||
              type === SignerType.PASSKEY ||
              (args.walletInfo.members.length === 1 && type === SignerType.NFC)
            );
          })
          .map((x) => ({
            state: SignerState.Unsigned,
            key: x.pubkey,
            type: getSignerTypeFromAddress(
              x,
              deviceWalletPublicKey,
              passkeyWalletPublicKey
            ),
          })) || [];
      setSelectedSigners(preSelectedSigners);
    }
  }, [
    args.walletInfo,
    selectedSigners,
    deviceWalletPublicKey,
    passkeyWalletPublicKey,
  ]);

  return (
    <>
      <Heading size="$3">{`Number of Signers Required: ${
        selectedSigners?.length || 0
      } / ${args.walletInfo?.threshold || 0}`}</Heading>
      <YGroup>
        {args.walletInfo?.members.map((x) => {
          const type = getSignerTypeFromAddress(
            x,
            deviceWalletPublicKey,
            passkeyWalletPublicKey
          );
          return (
            <YGroup.Item key={x.pubkey.toString()}>
              <ListItem
                hoverStyle={{ scale: 0.925 }}
                pressStyle={{ scale: 0.925 }}
                animation="bouncy"
                hoverTheme
                pressTheme
                bordered
                padded
                title={x.pubkey.toString()}
                subTitle={type}
                iconAfter={
                  <Checkbox
                    theme={"active"}
                    defaultChecked={
                      type === SignerType.DEVICE ||
                      type === SignerType.PASSKEY ||
                      (args.walletInfo.members.length === 1 &&
                        type === SignerType.NFC)
                    }
                    onCheckedChange={(e) => {
                      if (e.valueOf()) {
                        setSelectedSigners((prev) =>
                          prev
                            ? prev.findIndex(
                                (y) => y.key.toString() === x.pubkey.toString()
                              ) === -1
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
                          prev?.filter(
                            (y) => y.key.toString() !== x.pubkey.toString()
                          )
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
        themeInverse
        width={"100%"}
        disabled={
          selectedSigners &&
          args.walletInfo &&
          args.walletInfo.threshold > selectedSigners.length
        }
        onPress={() => {
          if (
            selectedSigners &&
            args.walletInfo &&
            args.walletInfo.threshold <= selectedSigners.length
          ) {
            handleConfirmation(selectedSigners);
          }
        }}
      >
        <ButtonText>{"Continue"}</ButtonText>
      </CustomButton>
    </>
  );
};

const ConfirmationState: FC<{
  confirmedSigners: TransactionSigner[];
  setConfirmedSigners: React.Dispatch<
    React.SetStateAction<TransactionSigner[] | null>
  >;
  walletAddress: PublicKey;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  transaction: {
    totalFees: number | null;
    ixs: TransactionInstruction[];
    lookUpTables?: AddressLookupTableAccount[];
  };
  reset: (callback?: () => void) => Promise<void>;
}> = ({
  confirmedSigners,
  setConfirmedSigners,
  walletAddress,
  error,
  setError,
  transaction,
  reset,
}) => {
  const buildAndSendTransactionMutation = useBuildAndSendTransaction({
    wallet: walletAddress,
  });
  const toast = useToastController();

  useEffect(() => {
    if (
      !buildAndSendTransactionMutation.isPending &&
      !confirmedSigners.some((x) => x.state === SignerState.Error)
    ) {
      sendTransaction();
    }
  }, [confirmedSigners, transaction]);

  const sendTransaction = async () => {
    buildAndSendTransactionMutation
      .mutateAsync({
        signers: confirmedSigners,
        ...transaction,
        callback: (e) => {
          setConfirmedSigners((prev) =>
            prev
              ? prev.map((x) =>
                  x.key.toString() === e.key.toString()
                    ? { ...x, state: e.state }
                    : x
                )
              : null
          );
        },
      })
      .then((sig) => {
        if (sig) {
          reset();
          toast.show("Transaction Success!", {
            customData: { preset: "success" },
          });
        }
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  return (
    <>
      <Heading size="$3">Getting Required Signatures</Heading>
      <YGroup>
        {confirmedSigners
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
      <YStack alignItems="flex-end" justifyContent="center" width={"100%"}>
        {transaction.totalFees && (
          <Text fontSize={"$1"}>{`Network Fee: ${
            transaction.totalFees / LAMPORTS_PER_SOL
          } SOL`}</Text>
        )}
      </YStack>
      {!error && (
        <XStack alignItems="center" gap="$2">
          <Spinner />
          <Text>{`${
            confirmedSigners.every((x) => x.state === SignerState.Signed)
              ? "Sending transaction in progress"
              : "Fetching signatures in progress"
          }`}</Text>
        </XStack>
      )}
    </>
  );
};
