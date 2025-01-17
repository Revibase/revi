import { PublicKey } from "@solana/web3.js";
import {
  Settings2,
  UserRoundCheck,
  UserRoundX,
  UsersRound,
} from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { useCopyToClipboard } from "components/hooks/useCopyToClipboard";
import { FC, useMemo, useState } from "react";
import { Button, ButtonIcon, ButtonText, XStack, YStack } from "tamagui";
import { Page } from "utils/enums/page";
import { getVaultFromAddress } from "utils/helper";
import { DAS } from "utils/types/das";
import { TransactionArgs } from "utils/types/transaction";

import { useValidateWallet } from "components/hooks/useValidateWallet";
import { WalletType } from "utils/enums/wallet";
import { AssetTab } from "./assetTab";
import { CollectiblesTab } from "./collectiblesTab";
import { TokenTab } from "./tokenTab";

enum Tab {
  MainAsset = "Main",
  Tokens = "Tokens",
  Collectibles = "Collectibles",
}
export const Main: FC<{
  type: WalletType;
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
  closeSheet: () => void;
}> = ({
  type,
  walletAddress,
  mint,
  setPage,
  setViewAsset,
  setWithdrawAsset,
  setArgs,
  closeSheet,
}) => {
  const [tab, setTab] = useState(mint ? Tab.MainAsset : Tab.Tokens);

  const copyToClipboard = useCopyToClipboard();

  const {
    deviceWalletPublicKeyIsMember,
    cloudWalletPublicKeyIsMember,
    noOwners,
  } = useValidateWallet(walletAddress, type, setPage, setArgs, closeSheet);

  const MemberIcon = useMemo(() => {
    if (noOwners) {
      return <UserRoundX size={"$1"} color={"$orange10"} />;
    }
    if (cloudWalletPublicKeyIsMember || deviceWalletPublicKeyIsMember) {
      return <UserRoundCheck size={"$1"} color={"$green10"} />;
    }
    return <UsersRound size={"$1"} color={"$blue10"} />;
  }, [noOwners, cloudWalletPublicKeyIsMember, deviceWalletPublicKeyIsMember]);

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
              type === WalletType.MULTIWALLET
                ? getVaultFromAddress(walletAddress).toString()
                : walletAddress?.toString()
            )
          }
        >
          <ButtonIcon children={MemberIcon} />
          <ButtonText numberOfLines={1} textAlign="left">
            {type === WalletType.MULTIWALLET
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
