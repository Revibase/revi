import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { useToastController } from "@tamagui/toast";
import { useMutation } from "@tanstack/react-query";
import { decryptExportBundle, generateP256KeyPair } from "@turnkey/crypto";
import { isSupported } from "@turnkey/react-native-passkey-stamper";
import { useGlobalVariables } from "components/providers/globalProvider";
import { WalletType } from "utils/enums/wallet";
import {
  retrieveDeviceWalletKeypair,
  retrieveDeviceWalletSeedPhrase,
} from "utils/queries/useGetDevicePublicKey";
import { StamperType, turnKeyClient } from "utils/turnkey";

export function useExportWallet() {
  const toast = useToastController();
  const { subOrganizationId, passkeyWalletPublicKey } = useGlobalVariables();
  return useMutation({
    mutationKey: ["export-wallet"],
    mutationFn: async ({
      walletType,
      returnMnemonic,
    }: {
      walletType: WalletType;
      returnMnemonic: boolean;
    }) => {
      try {
        switch (walletType) {
          case WalletType.DEVICE:
            if (returnMnemonic) {
              return await retrieveDeviceWalletSeedPhrase();
            } else {
              const deviceKeypair = await retrieveDeviceWalletKeypair();
              return bs58.encode(deviceKeypair.secretKey);
            }
          case WalletType.PASSKEY:
            if (!isSupported()) {
              throw new Error("Passkey is not supported on this device!");
            }
            if (!subOrganizationId || !passkeyWalletPublicKey) {
              throw new Error("Address or organization id is missing.");
            }
            const turnkey = turnKeyClient(StamperType.PASSKEY);
            const keyPair = generateP256KeyPair();
            const privateKey = keyPair.privateKey;
            const publicKey = keyPair.publicKeyUncompressed;
            let exportBundle: string;
            if (!returnMnemonic) {
              const response = await turnkey.exportWalletAccount({
                type: "ACTIVITY_TYPE_EXPORT_WALLET_ACCOUNT",
                timestampMs: Date.now().toString(),
                organizationId: subOrganizationId,
                parameters: {
                  address: passkeyWalletPublicKey.toString(),
                  targetPublicKey: publicKey,
                },
              });
              if (!response.activity.result.exportWalletAccountResult) {
                throw new Error("Unable to export Wallet Address");
              }
              exportBundle =
                response.activity.result.exportWalletAccountResult.exportBundle;
            } else {
              const { wallets } = await turnKeyClient(
                StamperType.APIKEY
              ).getWallets({
                organizationId: subOrganizationId,
              });
              const walletId = wallets.find(
                (x) => x.walletName === "default"
              )?.walletId;
              if (!walletId) {
                throw new Error("Unable to retrieve wallet id");
              }
              const response = await turnkey.exportWallet({
                type: "ACTIVITY_TYPE_EXPORT_WALLET",
                timestampMs: Date.now().toString(),
                organizationId: subOrganizationId,
                parameters: {
                  targetPublicKey: publicKey,
                  walletId: walletId,
                  language: "MNEMONIC_LANGUAGE_ENGLISH",
                },
              });
              if (!response.activity.result.exportWalletResult) {
                throw new Error("Unable to export Wallet Address");
              }
              exportBundle =
                response.activity.result.exportWalletResult.exportBundle;
            }
            const result = await decryptExportBundle({
              exportBundle,
              embeddedKey: privateKey,
              organizationId: subOrganizationId,
              returnMnemonic,
              keyFormat: "SOLANA",
            });
            return result;
          default:
            return null;
        }
      } catch (error: any) {
        toast.show("Error", {
          message: `${error.message}`,
          customData: {
            preset: "error",
          },
        });
        return null;
      }
    },
  });
}
