import { PublicKey } from "@solana/web3.js";
import { Copy, Wallet } from "@tamagui/lucide-icons";
import { useCopyToClipboard } from "components/hooks/useCopyToClipboard";
import { FC } from "react";
import { ListItem, Text } from "tamagui";
import { SignerType } from "utils/enums/transaction";
import { getMultiSigFromAddress, getVaultFromAddress } from "utils/helper";
import { useGetWalletInfo } from "utils/queries/useGetWalletInfo";

export const RenderWalletInfo: FC<{
  type: SignerType;
  walletAddress: PublicKey;
}> = ({ type, walletAddress }) => {
  const { data: walletInfo } = useGetWalletInfo({
    address:
      type === SignerType.NFC ? getMultiSigFromAddress(walletAddress) : null,
  });
  const copyToClipboard = useCopyToClipboard();
  return (
    <>
      {walletInfo?.label && (
        <Text numberOfLines={1}>{`Label: ${walletInfo.label}`}</Text>
      )}
      {walletInfo?.threshold && (
        <Text>{`Signatures Threshold: ${walletInfo.threshold}`}</Text>
      )}
      {walletAddress && (
        <ListItem
          bordered
          borderRadius="$4"
          onPress={() =>
            copyToClipboard(
              (type === SignerType.NFC
                ? getVaultFromAddress(walletAddress).toString()
                : walletAddress.toString()
              ).toString()
            )
          }
          hoverTheme
          pressTheme
          title={
            type === SignerType.NFC
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
