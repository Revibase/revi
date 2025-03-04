import { transferAsset } from "@revibase/token-transfer";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Copy, Wallet } from "@tamagui/lucide-icons";
import { useCopyToClipboard } from "components/hooks";
import { useConnection } from "components/providers/connectionProvider";
import { FC, useCallback, useMemo } from "react";
import { Alert } from "react-native";
import { ButtonText, Text, XGroup, YGroup, YStack } from "tamagui";
import {
  SignerState,
  SignerType,
  WalletType,
  formatAmount,
  useGetAssetsByOwner,
  useGlobalStore,
} from "utils";
import { useGetAccountInfo } from "utils/queries/useGetAccountInfo";
import { CustomButton } from "./ui/CustomButton";
import { CustomListItem } from "./ui/CustomListItem";

export const Paymaster: FC = () => {
  const {
    deviceWalletPublicKey,
    paymasterWalletPublicKey,
    setGenericSheetArgs,
    setTransactionSheetArgs,
  } = useGlobalStore();
  const { data: deviceWalletAssets } = useGetAssetsByOwner({
    address: deviceWalletPublicKey,
  });
  const { data: paymasterAccountInfo } = useGetAccountInfo({
    address: paymasterWalletPublicKey,
  });
  const { connection } = useConnection();
  const copyToClipboard = useCopyToClipboard();
  const theme = useMemo(
    () =>
      (paymasterAccountInfo?.lamports ?? 0) < LAMPORTS_PER_SOL * 0.01
        ? "red"
        : (paymasterAccountInfo?.lamports ?? 0) < LAMPORTS_PER_SOL * 0.023
        ? "yellow"
        : "green",
    [paymasterAccountInfo]
  );
  const paymasterLamports = useMemo(
    () => paymasterAccountInfo?.lamports ?? 0,
    [paymasterAccountInfo]
  );
  const deviceLamports = useMemo(
    () => deviceWalletAssets?.nativeBalance.lamports ?? 0,
    [deviceWalletAssets]
  );
  const handleTopUp = useCallback(async () => {
    const amount = 0.023 * LAMPORTS_PER_SOL - paymasterLamports;
    if (
      paymasterWalletPublicKey &&
      deviceWalletPublicKey &&
      deviceLamports > amount
    ) {
      const ixs = await transferAsset(
        connection,
        new PublicKey(deviceWalletPublicKey),
        new PublicKey(paymasterWalletPublicKey),
        new PublicKey(deviceWalletPublicKey),
        amount / LAMPORTS_PER_SOL,
        true
      );
      setGenericSheetArgs(null);
      setTransactionSheetArgs({
        ixs,
        walletAddress: deviceWalletPublicKey,
        feePayer: deviceWalletPublicKey,
        signers: [
          {
            key: deviceWalletPublicKey,
            type: SignerType.DEVICE,
            state: SignerState.Unsigned,
          },
        ],
      });
    } else {
      Alert.alert(
        "Insufficient SOL",
        `Device Wallet needs at least ${
          (amount - deviceLamports) / LAMPORTS_PER_SOL
        } SOL`
      );
    }
  }, [deviceLamports, deviceWalletPublicKey, paymasterWalletPublicKey]);
  return (
    <CustomButton
      bordered
      theme={theme}
      size={"$3"}
      borderTopEndRadius={"$2"}
      borderTopStartRadius={"$2"}
      borderBottomEndRadius={"$2"}
      borderBottomStartRadius={"$2"}
      onPress={() => {
        setGenericSheetArgs({
          theme,
          snapPoints: [60],
          title: "Top Up Paymaster",
          body: (
            <YStack gap={"$4"}>
              <CustomListItem
                bordered
                borderTopEndRadius={"$2"}
                borderTopStartRadius={"$2"}
                borderBottomEndRadius={"$2"}
                borderBottomStartRadius={"$2"}
                icon={<Wallet size={"$1"} />}
                title={`${formatAmount(
                  paymasterLamports / LAMPORTS_PER_SOL
                )} SOL`}
                subTitle={`Wallet Address: ${paymasterWalletPublicKey}`}
                iconAfter={<Copy size={"$1"} />}
                onPress={() =>
                  paymasterWalletPublicKey &&
                  copyToClipboard(paymasterWalletPublicKey)
                }
              />
              <YGroup>
                <YGroup.Item>
                  <CustomListItem
                    bordered
                    title={"What is a Paymaster?"}
                    subTitle={
                      <Text color={"gray"}>
                        {`Paymaster is a custodial wallet with vote-only permissions in a multisig, mainly used to cover network fees.`}
                      </Text>
                    }
                  />
                </YGroup.Item>
                <YGroup.Item>
                  <CustomListItem
                    bordered
                    title={"How much are network fees?"}
                    subTitle={
                      <Text
                        color={"gray"}
                      >{`Network fees typically range from 0.00005 SOL to 0.003 SOL. To ensure you always have enough for transactions, it's best to maintain a balance of at least 0.023 SOL.`}</Text>
                    }
                  />
                </YGroup.Item>
              </YGroup>
              <CustomButton bordered onPress={handleTopUp}>
                <ButtonText>{`Top up to 0.023 SOL`}</ButtonText>
              </CustomButton>
            </YStack>
          ),
        });
      }}
      disabled={!paymasterWalletPublicKey}
      children={
        <XGroup items={"center"} gap={"$1"}>
          <Text>{`${WalletType.PAYMASTER}:`}</Text>
          <Text fontSize={"$3"} fontWeight={600} letterSpacing={"$1"}>{`${
            paymasterLamports < LAMPORTS_PER_SOL * 0.01
              ? "Top Up Required"
              : paymasterLamports < LAMPORTS_PER_SOL * 0.023
              ? "Top Up"
              : "Healthy"
          }`}</Text>
        </XGroup>
      }
    />
  );
};
