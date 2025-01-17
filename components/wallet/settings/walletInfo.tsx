import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Copy, Wallet } from "@tamagui/lucide-icons";
import { CustomListItem } from "components/CustomListItem";
import { useCopyToClipboard } from "components/hooks/useCopyToClipboard";
import { FC } from "react";
import { Text } from "tamagui";
import { WalletType } from "utils/enums/wallet";
import {
  formatAmount,
  getMultiSigFromAddress,
  getVaultFromAddress,
} from "utils/helper";
import { useGetCurrentOffers } from "utils/queries/useGetCurrentOffers";
import { useGetWalletInfo } from "utils/queries/useGetWalletInfo";

export const RenderWalletInfo: FC<{
  type: WalletType;
  walletAddress: PublicKey;
}> = ({ type, walletAddress }) => {
  const { data: walletInfo } = useGetWalletInfo({
    address:
      type === WalletType.MULTIWALLET
        ? getMultiSigFromAddress(walletAddress)
        : null,
  });
  const copyToClipboard = useCopyToClipboard();
  const { data: offers } = useGetCurrentOffers({
    accounts: walletInfo ? [walletInfo?.createKey.toString()] : [],
  });
  return (
    <>
      {!!offers && offers.length > 0 && (
        <Text>{`Highest Pending Offer: ${formatAmount(
          offers?.sort((a, b) => b.amount - a.amount)[0].amount /
            LAMPORTS_PER_SOL
        )} SOL`}</Text>
      )}
      {walletInfo?.threshold && (
        <Text>{`Current Signature Threshold: ${walletInfo.threshold}`}</Text>
      )}
      {walletAddress && (
        <CustomListItem
          bordered
          borderRadius="$4"
          onPress={() =>
            copyToClipboard(
              (type === WalletType.MULTIWALLET
                ? getVaultFromAddress(walletAddress).toString()
                : walletAddress.toString()
              ).toString()
            )
          }
          title={
            type === WalletType.MULTIWALLET
              ? getVaultFromAddress(walletAddress).toString()
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
