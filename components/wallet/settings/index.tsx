import { FC } from "react";
import { YStack } from "tamagui";
import { Page, useGlobalStore, WalletType } from "utils";
import { ScreenWrapper } from "../screenWrapper";
import { RenderWalletInfo } from "./walletInfo";
import { RenderWalletMembers } from "./walletMembers";
import { RenderSecretButtons } from "./walletSecretInfo";

export const SettingsPage: FC = () => {
  const {
    walletSheetArgs,
    setPage,
    deviceWalletPublicKey,
    cloudWalletPublicKey,
  } = useGlobalStore();
  const { walletAddress, type } = walletSheetArgs ?? {};
  return (
    <>
      {type === WalletType.DEVICE &&
        walletAddress &&
        deviceWalletPublicKey?.toString() === walletAddress.toString() && (
          <ScreenWrapper text="Wallet Details" reset={() => setPage(Page.Main)}>
            <YStack gap={"$4"}>
              <RenderWalletInfo />
              <RenderSecretButtons walletType={WalletType.DEVICE} />
            </YStack>
          </ScreenWrapper>
        )}

      {type === WalletType.CLOUD &&
        walletAddress &&
        cloudWalletPublicKey?.toString() === walletAddress.toString() && (
          <ScreenWrapper text="Wallet Details" reset={() => setPage(Page.Main)}>
            <YStack gap={"$4"}>
              <RenderWalletInfo />
              <RenderSecretButtons walletType={WalletType.CLOUD} />
            </YStack>
          </ScreenWrapper>
        )}

      {type === WalletType.MULTIWALLET && walletAddress && (
        <RenderWalletMembers />
      )}
    </>
  );
};
