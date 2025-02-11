import { getVaultFromAddress } from "@revibase/multi-wallet";
import { PublicKey } from "@solana/web3.js";
import {
  MoreVertical,
  UserRoundCheck,
  UserRoundX,
  UsersRound,
} from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { CustomListItem } from "components/CustomListItem";
import {
  useCopyToClipboard,
  usePendingOffers,
  useWallet,
} from "components/hooks";
import { FC, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, ButtonText, Sheet, XStack, YStack } from "tamagui";
import { Page, useGlobalStore, WalletType } from "utils";
import { AssetTab } from "./assetTab";
import { CollectiblesTab } from "./collectiblesTab";
import { TokenTab } from "./tokenTab";

enum Tab {
  MainAsset = "Main",
  Tokens = "Tokens",
  Collectibles = "Collectibles",
}
export const Main: FC = () => {
  const {
    walletSheetArgs,
    defaultWallet,
    setPage,
    setPendingOffersCheck,
    setNoOwnersCheck,
  } = useGlobalStore();
  const {
    mint,
    type,
    walletAddress,
    theme,
    pendingOffersCheck = false,
    noOwnersCheck = false,
  } = walletSheetArgs ?? {};
  const [tab, setTab] = useState(mint ? Tab.MainAsset : Tab.Tokens);
  const copyToClipboard = useCopyToClipboard();

  const {
    walletInfo,
    handleTakeOverAsOwner,
    deviceWalletPublicKeyIsMember,
    cloudWalletPublicKeyIsMember,
    noOwners,
  } = useWallet({ theme, walletAddress, type });

  const { hasPendingOffers } = usePendingOffers({ type, walletAddress });

  useEffect(() => {
    if (!noOwnersCheck && noOwners && walletInfo) {
      Alert.alert(
        "No owners found.",
        "Would you like to designate yourself as the owner?",
        [
          {
            text: "Cancel",
          },
          {
            text: "OK",
            onPress: handleTakeOverAsOwner,
          },
        ]
      );
      setNoOwnersCheck(true);
    }
  }, [noOwners, handleTakeOverAsOwner, walletInfo]);

  useEffect(() => {
    if (
      !pendingOffersCheck &&
      walletInfo &&
      (deviceWalletPublicKeyIsMember || cloudWalletPublicKeyIsMember) &&
      hasPendingOffers
    ) {
      Alert.alert(
        "Wallet is locked as there are pending offers.",
        "Would you like to view those offer?",
        [
          {
            text: "Cancel",
          },
          {
            text: "OK",
            onPress: () => {
              setPage(Page.OffersPage);
            },
          },
        ]
      );
      setPendingOffersCheck(true);
    }
  }, [
    pendingOffersCheck,
    deviceWalletPublicKeyIsMember,
    cloudWalletPublicKeyIsMember,
    walletInfo,
    hasPendingOffers,
  ]);

  const MemberIcon = useMemo(() => {
    if (noOwners) {
      return <UserRoundX size={"$1.5"} color={"orange"} />;
    }
    if (cloudWalletPublicKeyIsMember || deviceWalletPublicKeyIsMember) {
      return <UserRoundCheck size={"$1.5"} color={"green"} />;
    }
    return <UsersRound size={"$1.5"} color={"blue"} />;
  }, [noOwners, cloudWalletPublicKeyIsMember, deviceWalletPublicKeyIsMember]);

  const renderTabContent = useMemo(() => {
    switch (tab) {
      case Tab.MainAsset:
        return mint && <AssetTab />;
      case Tab.Tokens:
        return <TokenTab />;
      case Tab.Collectibles:
        return <CollectiblesTab />;
      default:
        return null;
    }
  }, [tab]);
  const { bottom } = useSafeAreaInsets();
  return (
    <Sheet.ScrollView showsVerticalScrollIndicator={false}>
      <YStack items="center" gap="$4" p={"$4"} pb={bottom + 16} flex={1}>
        <CustomListItem
          bordered
          py={"$2"}
          pr={"$2"}
          borderTopLeftRadius={"$4"}
          borderTopRightRadius={"$4"}
          borderBottomLeftRadius={"$4"}
          borderBottomRightRadius={"$4"}
          icon={MemberIcon}
          theme={noOwners ? "red" : null}
          borderColor={"$borderColor"}
          title={
            type === WalletType.MULTIWALLET && walletAddress
              ? getVaultFromAddress(new PublicKey(walletAddress)).toString()
              : walletAddress?.toString()
          }
          onPress={() =>
            copyToClipboard(
              type === WalletType.MULTIWALLET && walletAddress
                ? getVaultFromAddress(new PublicKey(walletAddress)).toString()
                : walletAddress?.toString() || ""
            )
          }
          subTitle={`${type}${
            defaultWallet?.toString() === walletAddress?.toString()
              ? " (Default)"
              : ""
          }`}
          iconAfter={
            <CustomButton
              size={"$3"}
              variant="outlined"
              borderColor={"$colorTransparent"}
              icon={<MoreVertical size={"$1"} />}
              bordered
              onPress={() => setPage(Page.Settings)}
            />
          }
        />
        <XStack gap="$4">
          {Object.entries(Tab)
            .filter((x) => (x[1] === Tab.MainAsset && !mint ? false : true))
            .map((x) => (
              <Button
                borderColor={"$borderColor"}
                borderWidth={x[1] === tab ? "$1" : "$0"}
                variant={x[1] === tab ? undefined : "outlined"}
                onPress={() => setTab(x[1])}
                key={x[0]}
                size={"$3"}
              >
                <ButtonText>{x[1]}</ButtonText>
              </Button>
            ))}
        </XStack>
        {renderTabContent}
      </YStack>
    </Sheet.ScrollView>
  );
};
