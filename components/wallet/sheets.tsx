import { PublicKey } from "@solana/web3.js";
import { FC, memo, useCallback } from "react";
import { Keyboard } from "react-native";
import { Sheet } from "tamagui";
import { WalletType } from "utils/enums/wallet";
import { TransactionArgs } from "utils/types/transaction";
import { Wallet } from ".";

export const WalletSheets: FC<{
  type: WalletType;
  address: PublicKey | null | undefined;
  reset: () => void;
  mint: PublicKey | null | undefined;
  onEntry?: TransactionArgs;
}> = memo(({ type, address, reset, mint, onEntry }) => {
  const handleOpenChange = useCallback(
    (open: boolean) => {
      Keyboard.dismiss();
      if (!open) {
        reset();
      }
    },
    [reset]
  );

  return (
    <Sheet
      forceRemoveScrollEnabled={true}
      modal={true}
      open={!!address}
      defaultOpen={false}
      snapPoints={[90]}
      zIndex={100_000}
      animation="medium"
      snapPointsMode={"percent"}
      onOpenChange={handleOpenChange}
    >
      <Sheet.Overlay
        animation="medium"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        opacity={0.5}
      />
      <Sheet.Handle />
      <Sheet.Frame theme={"active"}>
        <Sheet.ScrollView showsVerticalScrollIndicator={false}>
          {!!address && (
            <Wallet
              type={type}
              walletAddress={address}
              mint={mint}
              closeSheet={reset}
              onEntry={onEntry}
            />
          )}
        </Sheet.ScrollView>
      </Sheet.Frame>
    </Sheet>
  );
});
