import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  ArrowLeft,
  Check,
  CircleCheck,
  Clock,
  TriangleAlert,
} from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import { useConnection } from "components/providers/connectionProvider";
import { useGlobalVariables } from "components/providers/globalProvider";
import { FC, useCallback, useEffect, useState } from "react";
import {
  Button,
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
import { SignerType } from "utils/enums/transaction";
import { Page } from "utils/enums/wallet";
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

  useEffect(() => {
    if (args.signers && args.ixs && connection) {
      prepareTransaction(args.ixs, args.signers, connection);
    }
  }, [args, connection]);

  const prepareTransaction = async (
    ixs: TransactionInstruction[],
    signers: TransactionSigner[],
    connection: Connection
  ) => {
    try {
      const { microLamports, units, totalFees } = await estimateFees(
        connection,
        ixs,
        getFeePayerFromSigners(signers),
        signers,
        false,
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
    } catch (err) {
      setError("Failed to prepare transaction.");
    }
  };

  const reset = useCallback(
    async (callback: () => void = () => setPage(Page.Main)) => {
      if (!error) {
        toast.show("Transaction Cancelled!", {
          customData: { preset: "error" },
        });
      }
      await NfcProxy.close();
      callback();
      setError(null);
      setArgs(null);
      setTransaction(null);
    },
    [error, setArgs, setPage, toast]
  );
  return (
    <YStack gap={"$4"} padding={"$4"}>
      <Header confirmedSigners={confirmedSigners} reset={reset} args={args} />
      {confirmedSigners && transaction ? (
        <ConfirmationState
          reset={reset}
          confirmedSigners={confirmedSigners}
          walletAddress={walletAddress}
          error={error}
          setError={setError}
          setConfirmedSigners={setConfirmedSigners}
          transaction={transaction}
        />
      ) : args.walletInfo ? (
        <SelectSignersState
          args={args}
          setConfirmedSigners={setConfirmedSigners}
          setTransaction={setTransaction}
        />
      ) : null}
      <CancelButton error={error} reset={reset} />
    </YStack>
  );
};

const Header: FC<{
  confirmedSigners: TransactionSigner[] | null;
  reset: (callback?: () => void) => Promise<void>;
  args: TransactionArgs;
}> = ({ confirmedSigners, reset, args }) => (
  <XStack
    padding="$2"
    justifyContent="space-between"
    alignItems="center"
    width={"100%"}
  >
    <Button
      backgroundColor={"$colorTransparent"}
      onPress={() => reset(args.callback)}
    >
      <ArrowLeft />
    </Button>
    <Text
      numberOfLines={1}
      width={"70%"}
      textAlign="center"
      fontSize={"$8"}
      fontWeight={800}
    >
      {confirmedSigners ? `Sending Transaction` : `Select Signers`}
    </Text>
    <Button opacity={0}>
      <ArrowLeft />
    </Button>
  </XStack>
);

const CancelButton: FC<{
  error: string | null;
  reset: (callback?: () => void) => Promise<void>;
}> = ({ error, reset }) => (
  <Button width="100%" onPress={() => reset()}>
    <ButtonText>{error ? "Back To Home" : "Cancel"}</ButtonText>
  </Button>
);

const SelectSignersState: FC<{
  args: TransactionArgs;
  setConfirmedSigners: React.Dispatch<
    React.SetStateAction<TransactionSigner[] | null>
  >;
  setTransaction: React.Dispatch<
    React.SetStateAction<{
      totalFees: number | null;
      ixs: TransactionInstruction[];
      lookUpTables?: AddressLookupTableAccount[];
    } | null>
  >;
}> = ({ args, setConfirmedSigners, setTransaction }) => {
  const [selectedSigners, setSelectedSigners] = useState<TransactionSigner[]>();
  const { primaryAddress, secondaryAddress } = useGlobalVariables();

  const createVaultExecuteIx = useCreateVaultExecuteIxMutation({
    wallet: args.walletInfo?.createKey,
  });
  const setOwnerIxMutation = useSetOwnerIxMutation({
    wallet: args.walletInfo?.createKey,
  });
  const { connection } = useConnection();

  useEffect(() => {
    if (
      !selectedSigners &&
      args.walletInfo?.members &&
      args.walletInfo.createKey
    ) {
      const preSelectedSigners =
        args.walletInfo.members
          .filter((x) => {
            const type = getSignerTypeFromAddress(
              x,
              args.walletInfo.createKey,
              primaryAddress,
              secondaryAddress
            );
            return (
              type === SignerType.PRIMARY ||
              type === SignerType.SECONDARY ||
              (args.walletInfo.members.length === 1 && type === SignerType.NFC)
            );
          })
          .map((x) => ({
            state: SignerState.Unsigned,
            key: x,
            type: getSignerTypeFromAddress(
              x,
              args.walletInfo.createKey,
              primaryAddress,
              secondaryAddress
            ),
          })) || [];
      setSelectedSigners(preSelectedSigners);
    }
  }, [args.walletInfo, selectedSigners, primaryAddress, secondaryAddress]);

  const handleConfirmation = useCallback(
    async (signers: TransactionSigner[]) => {
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
      const { microLamports, units, totalFees } = await estimateFees(
        connection,
        ixs,
        getFeePayerFromSigners(signers),
        signers,
        true,
        args.lookUpTables
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
      ixs = [result.ixs];
      if (microLamports) {
        ixs.unshift(
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports,
          })
        );
      }
      if (units) {
        ixs.unshift(
          ComputeBudgetProgram.setComputeUnitLimit({
            units,
          })
        );
      }
      setConfirmedSigners(signers);
      setTransaction({
        ixs,
        lookUpTables: result.lookUpTables,
        totalFees,
      });
    },
    [connection, args, createVaultExecuteIx, setOwnerIxMutation]
  );
  return (
    <>
      <Heading size="$3">{`Number of Signers Required: ${
        (args.walletInfo?.threshold || 0) - (selectedSigners?.length || 0)
      }`}</Heading>
      <YGroup>
        {args.walletInfo?.members.map((x) => {
          const type = getSignerTypeFromAddress(
            x,
            args.walletInfo.createKey,
            primaryAddress,
            secondaryAddress
          );
          return (
            <YGroup.Item key={x.toString()}>
              <ListItem
                hoverTheme
                pressTheme
                bordered
                padded
                title={x.toString()}
                subTitle={type}
                iconAfter={
                  <Checkbox
                    theme={"active"}
                    defaultChecked={
                      type === SignerType.PRIMARY ||
                      type === SignerType.SECONDARY ||
                      (args.walletInfo.members.length === 1 &&
                        type === SignerType.NFC)
                    }
                    onCheckedChange={(e) => {
                      if (e.valueOf()) {
                        setSelectedSigners((prev) =>
                          prev
                            ? prev.findIndex(
                                (y) => y.key.toString() === x.toString()
                              ) === -1
                              ? [
                                  ...prev,
                                  {
                                    key: x,
                                    type: type,
                                    state: SignerState.Unsigned,
                                  },
                                ]
                              : prev
                            : undefined
                        );
                      } else {
                        setSelectedSigners((prev) =>
                          prev?.filter((y) => y.key.toString() !== x.toString())
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
      <Button
        themeInverse
        width={"100%"}
        disabled={
          selectedSigners &&
          (args.walletInfo?.threshold || 0) > selectedSigners.length
        }
        onPress={() => {
          if (
            selectedSigners &&
            (args.walletInfo?.threshold || 0) <= selectedSigners.length
          ) {
            handleConfirmation(selectedSigners);
          }
        }}
      >
        <ButtonText>{"Continue"}</ButtonText>
      </Button>
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
              ? prev.map((x) => {
                  return x.key.toString() === e.key.toString()
                    ? { ...x, state: e.state }
                    : x;
                })
              : null
          );
        },
      })
      .then((sig) => {
        if (sig) {
          reset();
          toast.show("Transaction Success!", {
            customData: {
              preset: "success",
            },
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
          ?.sort((a, _) => (a.type == SignerType.NFC ? -1 : 1))
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
                    <Clock />
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
      <YStack
        gap="$4"
        alignItems="center"
        justifyContent="center"
        width={"100%"}
      >
        {!error ? (
          <>
            <Text>{`${
              confirmedSigners?.every((x) => x.state === SignerState.Signed)
                ? "Sending transaction in progress"
                : "Fetching signatures in progress"
            }`}</Text>
            <Spinner />
          </>
        ) : (
          <Text color="red">{error}</Text>
        )}
      </YStack>
    </>
  );
};
