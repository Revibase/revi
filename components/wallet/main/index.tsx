import { PublicKey } from "@solana/web3.js";
import { Settings2 } from "@tamagui/lucide-icons";
import AvatarPlaceholder from "components/avatarPlaceholder";
import { useCopyToClipboard } from "components/hooks/useCopyToClipboard";
import { useGlobalVariables } from "components/providers/globalProvider";
import { FC, useState } from "react";
import { Button, ButtonText, Dialog, XStack, YStack } from "tamagui";
import { SignerType } from "utils/enums/transaction";
import { Page } from "utils/enums/wallet";
import { getMultiSigFromAddress, getVaultFromAddress } from "utils/helper";
import { useGetWalletInfo } from "utils/queries/useGetWalletInfo";
import { DAS } from "utils/types/das";
import { TransactionArgs } from "utils/types/transaction";
import { Settings } from "../settings";
import { AssetTab } from "./assetTab";
import { CollectiblesTab } from "./collectiblesTab";
import { TokenTab } from "./tokenTab";
enum Tab {
  MainAsset = "Main Asset",
  Tokens = "Tokens",
  Collectibles = "Collectibles",
}
export const Main: FC<{
  type: SignerType;
  mint: PublicKey | undefined;
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
  close: () => void;
}> = ({
  type,
  walletAddress,
  mint,
  setPage,
  setViewAsset,
  setWithdrawAsset,
  setArgs,
  close,
}) => {
  const [tab, setTab] = useState(mint ? Tab.MainAsset : Tab.Tokens);
  const [openSettings, setOpenSettings] = useState(false);
  const copyToClipboard = useCopyToClipboard();
  const { data: walletInfo } = useGetWalletInfo({
    address:
      type === SignerType.NFC ? getMultiSigFromAddress(walletAddress) : null,
  });
  const { primaryAddress, secondaryAddress } = useGlobalVariables();

  const noOwners =
    !!walletInfo?.members &&
    (
      walletInfo?.members.filter(
        (x) => x.toString() !== walletAddress.toString()
      ) || []
    ).length === 0;

  const primaryAddressIsMember =
    !noOwners &&
    !!primaryAddress &&
    ((walletInfo?.members &&
      walletInfo.members.findIndex(
        (x) => x.toString() === primaryAddress.toString()
      ) !== -1) ||
      walletAddress.toString() === primaryAddress.toString());

  const secondaryAddressIsMember =
    !noOwners &&
    !!secondaryAddress &&
    ((walletInfo?.members &&
      walletInfo.members.findIndex(
        (x) => x.toString() === secondaryAddress.toString()
      ) !== -1) ||
      walletAddress.toString() === secondaryAddress.toString());

  return (
    <Dialog modal open={openSettings}>
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
          <Button
            maxWidth={"80%"}
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
            {noOwners && <AvatarPlaceholder size={35} />}
            {primaryAddressIsMember && (
              <AvatarPlaceholder type={SignerType.PRIMARY} size={35} />
            )}
            {secondaryAddressIsMember && (
              <AvatarPlaceholder type={SignerType.SECONDARY} size={35} />
            )}
            <ButtonText numberOfLines={1} textAlign="left">
              {type === SignerType.NFC
                ? getVaultFromAddress(walletAddress).toString()
                : walletAddress?.toString()}
            </ButtonText>
          </Button>
          <Dialog.Trigger onPress={() => setOpenSettings(true)} asChild>
            <Button size={"$3"}>
              <Settings2 />
            </Button>
          </Dialog.Trigger>
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
                <ButtonText>{x[1]}</ButtonText>
              </Button>
            ))}
        </XStack>
        {tab == Tab.MainAsset && mint && (
          <AssetTab
            type={type}
            mint={mint}
            setPage={setPage}
            setWithdrawAsset={setWithdrawAsset}
            walletAddress={walletAddress}
          />
        )}

        {tab == Tab.Tokens && (
          <TokenTab
            type={type}
            walletAddress={walletAddress}
            setPage={setPage}
            setViewAsset={setViewAsset}
          />
        )}
        {tab == Tab.Collectibles && (
          <CollectiblesTab
            type={type}
            walletAddress={walletAddress}
            setViewAsset={setViewAsset}
            setPage={setPage}
          />
        )}
        <Settings
          setOpenSettings={setOpenSettings}
          type={type}
          walletAddress={walletAddress}
          setPage={setPage}
          setArgs={setArgs}
          closeSheet={close}
        />
      </YStack>
    </Dialog>
  );
};
