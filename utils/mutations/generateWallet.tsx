import { Keypair } from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as bip39 from "bip39";
import { useGlobalVariables } from "components/providers/globalProvider";
import { derivePath } from "ed25519-hd-key";
import { Alert } from "react-native";
import * as Keychain from "react-native-keychain";
import {
  CLOUD_PRIVATE_KEY,
  CLOUD_PUBLIC_KEY,
  CLOUD_SEED_PHRASE,
  DEVICE_PRIVATE_KEY,
  DEVICE_PUBLIC_KEY,
  DEVICE_SEED_PHRASE,
} from "utils/consts";
import { WalletType } from "utils/enums/wallet";

export function useGenerateWallet() {
  const client = useQueryClient();
  const { cloudStorage } = useGlobalVariables();
  return useMutation({
    mutationKey: ["generate-wallet"],
    mutationFn: async ({
      walletType,
      mnemonic,
    }: {
      walletType: WalletType;
      mnemonic?: string;
    }) => {
      try {
        if (!mnemonic) {
          mnemonic = bip39.generateMnemonic(256);
        }
        const seed = await bip39.mnemonicToSeed(mnemonic);
        const path = "m/44'/501'/0'/0'";
        const derivedSeed = derivePath(path, seed.toString("hex")).key;
        const keypair = Keypair.fromSeed(derivedSeed);
        switch (walletType) {
          case WalletType.DEVICE:
            await Promise.all([
              Keychain.setGenericPassword(
                "Public Key",
                keypair.publicKey.toString(),
                {
                  service: DEVICE_PUBLIC_KEY,
                }
              ),
              Keychain.setGenericPassword(
                "Private Key",
                Buffer.from(keypair.secretKey).toString("hex"),
                {
                  service: DEVICE_PRIVATE_KEY,
                  accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
                  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
                  securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
                  authenticationPrompt: {
                    title: "Authenticate",
                    cancel: "Cancel",
                  },
                }
              ),
              Keychain.setGenericPassword("Seed Phrase", mnemonic, {
                service: DEVICE_SEED_PHRASE,
                accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
                accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
                securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
                authenticationPrompt: {
                  title: "Authenticate",
                  cancel: "Cancel",
                },
              }),
            ]);
            await client.invalidateQueries({
              queryKey: ["get-publickey", { walletType }],
            });
            await client.refetchQueries({
              queryKey: ["get-publickey", { walletType }],
            });
            break;
          case WalletType.CLOUD:
            if (!cloudStorage || !(await cloudStorage.isCloudAvailable())) {
              throw new Error("Cloudstorage is unavailable");
            }
            await Promise.all([
              cloudStorage.writeFile(
                CLOUD_PUBLIC_KEY,
                keypair.publicKey.toString()
              ),
              cloudStorage.writeFile(
                CLOUD_PRIVATE_KEY,
                Buffer.from(keypair.secretKey).toString("hex")
              ),
              cloudStorage.writeFile(CLOUD_SEED_PHRASE, mnemonic),
            ]);
            await client.invalidateQueries({
              queryKey: ["get-publickey", { walletType, cloudStorage }],
            });
            await client.refetchQueries({
              queryKey: ["get-publickey", { walletType, cloudStorage }],
            });
            break;
        }
        return walletType;
      } catch (error: any) {
        Alert.alert(`Create Wallet failed!`, `${error}`);
        return null;
      }
    },
  });
}
