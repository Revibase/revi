import { PublicKey } from "@solana/web3.js";
import {
  Settings2,
  UserRoundCheck,
  UserRoundX,
  UsersRound,
} from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { useCopyToClipboard } from "components/hooks/useCopyToClipboard";
import { useGlobalVariables } from "components/providers/globalProvider";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Button, ButtonIcon, ButtonText, XStack, YStack } from "tamagui";
import { Page } from "utils/enums/page";
import { SignerType } from "utils/enums/transaction";
import { getMultiSigFromAddress, getVaultFromAddress } from "utils/helper";
import { useGetWalletInfo } from "utils/queries/useGetWalletInfo";
import { DAS } from "utils/types/das";
import { SignerState, TransactionArgs } from "utils/types/transaction";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useToastController } from "@tamagui/toast";
import { router } from "expo-router";
import { Alert } from "react-native";
import { AssetTab } from "./assetTab";
import { CollectiblesTab } from "./collectiblesTab";
import { TokenTab } from "./tokenTab";

enum Tab {
  MainAsset = "Main",
  Tokens = "Tokens",
  Collectibles = "Collectibles",
}
export const Main: FC<{
  type: SignerType;
  mint: PublicKey | null | undefined;
  walletAddress: PublicKey;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  setViewAsset: React.Dispatch<
    React.SetStateAction<DAS.GetAssetResponse | undefined>
  >;
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
  walletAddress,
  mint,
  setPage,
  setViewAsset,
  setWithdrawAsset,
  setArgs,
}) => {
  const [tab, setTab] = useState(mint ? Tab.MainAsset : Tab.Tokens);

  const copyToClipboard = useCopyToClipboard();
  const toast = useToastController();
  const { data: walletInfo } = useGetWalletInfo({
    address:
      type === SignerType.NFC ? getMultiSigFromAddress(walletAddress) : null,
  });
  const { deviceWalletPublicKey, passkeyWalletPublicKey } =
    useGlobalVariables();

  const noOwners = useMemo(() => {
    return (
      !!walletInfo?.members &&
      (
        walletInfo?.members.filter(
          (x) => x.pubkey.toString() !== walletAddress.toString()
        ) || []
      ).length === 0
    );
  }, [walletInfo?.members, walletAddress]);

  const deviceWalletPublicKeyIsMember = useMemo(() => {
    return (
      !noOwners &&
      !!deviceWalletPublicKey &&
      ((walletInfo?.members &&
        walletInfo.members.findIndex(
          (x) => x.pubkey.toString() === deviceWalletPublicKey.toString()
        ) !== -1) ||
        walletAddress.toString() === deviceWalletPublicKey.toString())
    );
  }, [noOwners, deviceWalletPublicKey, walletInfo?.members, walletAddress]);

  const passkeyWalletPublicKeyIsMember = useMemo(() => {
    return (
      !noOwners &&
      !!passkeyWalletPublicKey &&
      ((walletInfo?.members &&
        walletInfo.members.findIndex(
          (x) => x.pubkey.toString() === passkeyWalletPublicKey.toString()
        ) !== -1) ||
        walletAddress.toString() === passkeyWalletPublicKey.toString())
    );
  }, [noOwners, passkeyWalletPublicKey, walletInfo?.members, walletAddress]);

  const MemberIcon = useMemo(() => {
    if (noOwners) {
      return <UserRoundX size={"$1"} color={"$orange10"} />;
    }
    if (passkeyWalletPublicKeyIsMember || deviceWalletPublicKeyIsMember) {
      return <UserRoundCheck size={"$1"} color={"$green10"} />;
    }
    return <UsersRound size={"$1"} color={"$blue10"} />;
  }, [noOwners, passkeyWalletPublicKeyIsMember, deviceWalletPublicKeyIsMember]);

  const handleSetOwner = useCallback(async () => {
    if (!deviceWalletPublicKey || !passkeyWalletPublicKey) {
      close();
      toast.show("Error", {
        message: "Device and Passkey Wallet needs to be created first.",
        customData: { preset: "error" },
      });
      router.replace("/(tabs)/profile");
      return;
    }
    if (noOwners && walletInfo) {
      setArgs({
        changeConfig: {
          newOwners: [
            {
              key: walletAddress,
              type: SignerType.NFC,
              state: SignerState.Unsigned,
            },
            {
              key: deviceWalletPublicKey,
              type: SignerType.DEVICE,
              state: SignerState.Unsigned,
            },
            {
              key: passkeyWalletPublicKey,
              type: SignerType.PASSKEY,
              state: SignerState.Unsigned,
            },
          ],
        },
        walletInfo,
      });
      setPage(Page.Confirmation);
    }
  }, [
    walletAddress,
    noOwners,
    walletInfo,
    deviceWalletPublicKey,
    passkeyWalletPublicKey,
  ]);
  useEffect(() => {
    const checkOwnerPrompt = async () => {
      const canceled = await AsyncStorage.getItem(
        `ownerPromptCanceled_${walletAddress}`
      );
      if (noOwners && !canceled) {
        Alert.alert(
          "No owners found.",
          "Would you like to designate yourself as the owner?",
          [
            {
              text: "Cancel",
              onPress: () =>
                AsyncStorage.setItem(
                  `ownerPromptCanceled_${walletAddress}`,
                  "true"
                ),
            },
            {
              text: "OK",
              onPress: handleSetOwner,
            },
          ]
        );
      }
    };

    checkOwnerPrompt();
  }, [noOwners, handleSetOwner, walletAddress]);

  const renderTabContent = useMemo(() => {
    switch (tab) {
      case Tab.MainAsset:
        return (
          mint && (
            <AssetTab
              type={type}
              mint={mint}
              setPage={setPage}
              setWithdrawAsset={setWithdrawAsset}
              walletAddress={walletAddress}
            />
          )
        );
      case Tab.Tokens:
        return (
          <TokenTab
            type={type}
            walletAddress={walletAddress}
            setPage={setPage}
            setViewAsset={setViewAsset}
          />
        );
      case Tab.Collectibles:
        return (
          <CollectiblesTab
            type={type}
            walletAddress={walletAddress}
            setViewAsset={setViewAsset}
            setPage={setPage}
          />
        );
      default:
        return null;
    }
  }, [tab, type, mint, setPage, setWithdrawAsset, walletAddress, setViewAsset]);

  return (
    <YStack alignItems="center" gap="$5" padding={"$4"} flex={1}>
      <XStack
        width={"100%"}
        alignItems="center"
        justifyContent="space-between"
        padding={"$2"}
        gap={"$2"}
        borderWidth={"$0.75"}
        borderColor={"$gray10Dark"}
        borderRadius={"$4"}
      >
        <CustomButton
          maxWidth={"85%"}
          alignItems="center"
          justifyContent="flex-start"
          flexGrow={1}
          backgroundColor={"$colorTransparent"}
          size={"$3"}
          onPress={() =>
            copyToClipboard(
              type === SignerType.NFC
                ? getVaultFromAddress(walletAddress).toString()
                : walletAddress?.toString()
            )
          }
        >
          <ButtonIcon children={MemberIcon} />
          <ButtonText numberOfLines={1} textAlign="left">
            {type === SignerType.NFC
              ? getVaultFromAddress(walletAddress).toString()
              : walletAddress?.toString()}
          </ButtonText>
        </CustomButton>
        <CustomButton
          size={"$3"}
          circular
          icon={<Settings2 size={"$1.5"} />}
          bordered
          theme={noOwners ? "red_active" : "active"}
          onPress={() => setPage(Page.Settings)}
        />
      </XStack>
      <XStack gap="$4">
        {Object.entries(Tab)
          .filter((x) => (x[1] === Tab.MainAsset && !mint ? false : true))
          .map((x) => (
            <Button
              backgroundColor={
                tab == x[1] ? "$accentBackground" : "$colorTransparent"
              }
              onPress={() => setTab(x[1])}
              key={x[0]}
              size={"$3"}
            >
              <ButtonText color={"$accentColor"}>{x[1]}</ButtonText>
            </Button>
          ))}
      </XStack>
      {renderTabContent}
    </YStack>
  );
};
