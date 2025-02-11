import { getVaultFromAddress } from "@revibase/multi-wallet";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Copy, Handshake, Wallet } from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { CustomListItem } from "components/CustomListItem";
import {
  useCopyToClipboard,
  usePendingOffers,
  useWalletInfo,
} from "components/hooks";
import { FC } from "react";
import { ButtonIcon, ButtonText, Text, XStack } from "tamagui";
import { formatAmount, Page, useGlobalStore, WalletType } from "utils";
export const RenderWalletInfo: FC = () => {
  const { walletSheetArgs, setPage } = useGlobalStore();
  const { type, walletAddress } = walletSheetArgs ?? {};
  const { walletInfo } = useWalletInfo({
    type,
    walletAddress,
  });
  const { hasPendingOffers, pendingOffers } = usePendingOffers({
    type,
    walletAddress,
  });
  const copyToClipboard = useCopyToClipboard();

  return (
    <>
      {type === WalletType.MULTIWALLET && (
        <XStack items={"center"} justify={"space-between"}>
          <Text>{`Highest Pending Offer: ${
            hasPendingOffers
              ? formatAmount(
                  pendingOffers!.sort((a, b) => b.amount - a.amount)[0].amount /
                    LAMPORTS_PER_SOL
                ) + "SOL"
              : "None"
          }`}</Text>

          <CustomButton
            bordered
            size={"$3"}
            onPress={() => setPage(Page.OffersPage)}
          >
            <ButtonIcon>
              <Handshake size={"$1"} />
            </ButtonIcon>
            <ButtonText>View Offers</ButtonText>
          </CustomButton>
        </XStack>
      )}

      {walletInfo?.threshold && (
        <Text>{`Current Signature Threshold: ${walletInfo.threshold}`}</Text>
      )}
      {walletAddress && (
        <CustomListItem
          bordered
          borderTopLeftRadius={"$4"}
          borderTopRightRadius={"$4"}
          borderBottomLeftRadius={"$4"}
          borderBottomRightRadius={"$4"}
          onPress={() =>
            copyToClipboard(
              (type === WalletType.MULTIWALLET
                ? getVaultFromAddress(new PublicKey(walletAddress)).toString()
                : walletAddress.toString()
              ).toString()
            )
          }
          title={
            type === WalletType.MULTIWALLET
              ? getVaultFromAddress(new PublicKey(walletAddress)).toString()
              : walletAddress.toString()
          }
          subTitle="Wallet Address"
          icon={<Wallet size="$1" />}
          iconAfter={<Copy size="$1" />}
        />
      )}
    </>
  );
};
