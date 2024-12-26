import { PublicKey } from "@solana/web3.js";
import { X } from "@tamagui/lucide-icons";
import { useGlobalVariables } from "components/providers/globalProvider";
import { FC, useState } from "react";
import { Button, Dialog, Heading, Unspaced } from "tamagui";
import { SignerType } from "utils/enums/transaction";
import { Page } from "utils/enums/wallet";
import { useExportPrimaryWallet } from "utils/mutations/exportPrimaryWallet";
import { useExportSecondaryWallet } from "utils/mutations/exportSecondaryWallet";
import { TransactionArgs } from "utils/types/transaction";
import { RenderWalletInfo } from "./walletInfo";
import { RenderWalletMembers } from "./walletMembers";
import { RenderSecretButtons } from "./walletSecretInfo";

export const Settings: FC<{
  type: SignerType;
  walletAddress: PublicKey;
  setOpenSettings: React.Dispatch<React.SetStateAction<boolean>>;
  setArgs: React.Dispatch<React.SetStateAction<TransactionArgs | null>>;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  closeSheet: () => void;
}> = ({
  type,
  walletAddress,
  setOpenSettings,
  setArgs,
  setPage,
  closeSheet,
}) => {
  const { primaryAddress, secondaryAddress, subOrganizationId } =
    useGlobalVariables();

  const [edit, setEdit] = useState(false);
  const exportPrimaryWallet = useExportPrimaryWallet();
  const exportSecondaryWallet = useExportSecondaryWallet({
    address: secondaryAddress,
    subOrganizationId,
  });
  const reset = () => {
    setEdit(false);
    setOpenSettings(false);
  };

  return (
    <Dialog.Portal
      paddingVertical={"$8"}
      justifyContent="flex-start"
      alignItems="center"
      minHeight={"100%"}
    >
      <Dialog.Overlay
        key="overlay"
        animation="quick"
        opacity={0.2}
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        onPress={() => reset()}
      />
      <Dialog.Content
        gap="$4"
        width={"85%"}
        enterStyle={{ y: -10, opacity: 0 }}
        exitStyle={{ y: -10, opacity: 0 }}
        animation={[
          "quick",
          {
            opacity: {
              overshootClamping: true,
            },
          },
        ]}
      >
        <Heading>
          {edit
            ? "Edit Members"
            : type === SignerType.NFC
            ? "Multisig Wallet Details"
            : "Wallet Details"}
        </Heading>

        {!edit && (
          <RenderWalletInfo type={type} walletAddress={walletAddress} />
        )}

        {type === SignerType.PRIMARY &&
          !edit &&
          primaryAddress?.toString() === walletAddress.toString() && (
            <RenderSecretButtons exportFunction={exportPrimaryWallet} />
          )}

        {type === SignerType.SECONDARY &&
          !edit &&
          secondaryAddress?.toString() === walletAddress.toString() && (
            <RenderSecretButtons exportFunction={exportSecondaryWallet} />
          )}

        {type === SignerType.NFC && (
          <RenderWalletMembers
            edit={edit}
            setEdit={setEdit}
            walletAddress={walletAddress}
            setArgs={setArgs}
            setPage={setPage}
            reset={reset}
            closeSheet={closeSheet}
          />
        )}
        <Unspaced>
          <Dialog.Close onPress={() => reset()} asChild>
            <Button
              position="absolute"
              top="$4"
              right="$4"
              size="$2"
              circular
              icon={X}
            />
          </Dialog.Close>
        </Unspaced>
      </Dialog.Content>
    </Dialog.Portal>
  );
};
