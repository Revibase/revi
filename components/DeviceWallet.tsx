import { Smartphone } from "@tamagui/lucide-icons";
import { FC } from "react";
import {
  formatAmount,
  getTotalValueFromWallet,
  useGetAssetsByOwner,
  useGlobalStore,
  WalletType,
} from "utils";
import { CustomListItem } from "./ui/CustomListItem";

export const DeviceWallet: FC = () => {
  const { deviceWalletPublicKey, setWalletSheetArgs } = useGlobalStore();
  const { data: deviceWalletAssets } = useGetAssetsByOwner({
    address: deviceWalletPublicKey,
  });
  return (
    <CustomListItem
      bordered
      borderTopEndRadius={"$2"}
      borderTopStartRadius={"$2"}
      borderBottomEndRadius={"$2"}
      borderBottomStartRadius={"$2"}
      padded
      theme={"blue"}
      title={`$${formatAmount(
        deviceWalletAssets ? getTotalValueFromWallet(deviceWalletAssets) : 0
      )}`}
      onPress={() => {
        if (deviceWalletPublicKey) {
          setWalletSheetArgs({
            walletAddress: deviceWalletPublicKey,
            type: WalletType.DEVICE,
            mint: null,
            theme: "blue",
          });
        }
      }}
      subTitle={WalletType.DEVICE}
      icon={<Smartphone size={"$1.5"} />}
      disabled={!deviceWalletPublicKey}
    />
  );
};
