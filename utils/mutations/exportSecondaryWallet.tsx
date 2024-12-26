import { PublicKey } from "@solana/web3.js";
import { useToastController } from "@tamagui/toast";
import { useMutation } from "@tanstack/react-query";
import { decryptExportBundle, generateP256KeyPair } from "@turnkey/crypto";
import { isSupported } from "@turnkey/react-native-passkey-stamper";
import { StamperType, turnKeyClient } from "utils/turnkey";

export function useExportSecondaryWallet({
  subOrganizationId,
  address,
}: {
  subOrganizationId: string | undefined;
  address: PublicKey | null | undefined;
}) {
  const toast = useToastController();
  const client = turnKeyClient(StamperType.PASSKEY);
  return useMutation({
    mutationKey: ["export-secondary-wallet", subOrganizationId, address],
    mutationFn: async ({ returnMnemonic }: { returnMnemonic: boolean }) => {
      try {
        if (!isSupported()) {
          throw new Error("Passkey is not supported on this device!");
        }
        if (!subOrganizationId || !address) {
          throw new Error("Address or organization id is missing.");
        }
        const keyPair = generateP256KeyPair();
        const privateKey = keyPair.privateKey;
        const publicKey = keyPair.publicKeyUncompressed;
        let exportBundle: string;
        if (!returnMnemonic) {
          const response = await client.exportWalletAccount({
            type: "ACTIVITY_TYPE_EXPORT_WALLET_ACCOUNT",
            timestampMs: Date.now().toString(),
            organizationId: subOrganizationId,
            parameters: {
              address: address.toString(),
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
          const response = await client.exportWallet({
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
