import { FC } from "react";
import { Sheet } from "tamagui";
import { useGlobalStore } from "utils";
import { Wallet } from "../wallet";

export const WalletSheet: FC = () => {
  const { walletSheetArgs, setWalletSheetArgs } = useGlobalStore();

  return (
    <Sheet
      dismissOnSnapToBottom
      modal={true}
      open={!!walletSheetArgs}
      snapPoints={[90]}
      zIndex={100_000}
      animation="medium"
      snapPointsMode={"percent"}
      onOpenChange={(open) => {
        if (!open) {
          setWalletSheetArgs(null);
        }
      }}
    >
      <Sheet.Overlay
        animation="medium"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        opacity={0.5}
      />
      <Sheet.Handle theme={walletSheetArgs?.theme || "accent"} />
      <Sheet.Frame theme={walletSheetArgs?.theme || "accent"}>
        <Wallet />
      </Sheet.Frame>
    </Sheet>
  );
};
