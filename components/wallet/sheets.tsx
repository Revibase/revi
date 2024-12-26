import { PublicKey } from "@solana/web3.js";
import { FC } from "react";
import { Sheet } from "tamagui";
import { SignerType } from "utils/enums/transaction";
import { Wallet } from ".";

export const WalletSheets: FC<{
  type: SignerType;
  address: PublicKey | null | undefined;
  reset: () => void;
  mint: PublicKey | undefined;
}> = ({ type, address, reset, mint }) => {
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
      onOpenChange={(open) => {
        if (!open) {
          reset();
        }
      }}
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        key="overlay"
        opacity={0.5}
      />
      <Sheet.Handle />
      <Sheet.Frame>
        <Sheet.ScrollView showsVerticalScrollIndicator={false}>
          {address && (
            <Wallet
              type={type}
              walletAddress={address}
              mint={mint}
              close={() => reset()}
            />
          )}
        </Sheet.ScrollView>
      </Sheet.Frame>
    </Sheet>
  );
};
