import { PublicKey } from "@solana/web3.js";
import { useGlobalVariables } from "components/providers/globalProvider";
import { FC } from "react";
import { Page } from "utils/enums/page";
import { SignerType } from "utils/enums/transaction";
import { WalletType } from "utils/enums/wallet";
import { TransactionArgs } from "utils/types/transaction";
import { Header } from "../header";
import { RenderWalletInfo } from "./walletInfo";
import { RenderSecretButtons } from "./walletSecretInfo";

import { YStack } from "tamagui";
import { RenderWalletMembers } from "./walletMembers";

interface SettingsProps {
  type: SignerType;
  walletAddress: PublicKey;
  setArgs: React.Dispatch<React.SetStateAction<TransactionArgs | null>>;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  closeSheet: () => void;
}

export const SettingsPage: FC<SettingsProps> = ({
  type,
  walletAddress,
  setArgs,
  setPage,
  closeSheet,
}) => {
  const { deviceWalletPublicKey, passkeyWalletPublicKey } =
    useGlobalVariables();

  return (
    <YStack
      enterStyle={{ opacity: 0, x: -25 }}
      animation={"medium"}
      gap="$4"
      padding={"$4"}
      flex={1}
    >
      {type === SignerType.DEVICE &&
        deviceWalletPublicKey?.toString() === walletAddress.toString() && (
          <>
            <Header text={"Wallet Details"} reset={() => setPage(Page.Main)} />
            <RenderWalletInfo type={type} walletAddress={walletAddress} />
            <RenderSecretButtons walletType={WalletType.DEVICE} />
          </>
        )}

      {type === SignerType.PASSKEY &&
        passkeyWalletPublicKey?.toString() === walletAddress.toString() && (
          <>
            <Header text={"Wallet Details"} reset={() => setPage(Page.Main)} />
            <RenderWalletInfo type={type} walletAddress={walletAddress} />
            <RenderSecretButtons walletType={WalletType.PASSKEY} />
          </>
        )}

      {type === SignerType.NFC && walletAddress && (
        <RenderWalletMembers
          walletAddress={walletAddress}
          setArgs={setArgs}
          setPage={setPage}
          reset={() => setPage(Page.Main)}
          closeSheet={closeSheet}
        />
      )}
    </YStack>
  );
};
