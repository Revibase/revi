import { Keypair } from "@solana/web3.js";
import { useMutation } from "@tanstack/react-query";
import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Alert } from "react-native";
import * as Keychain from "react-native-keychain";
import { Passkey } from "react-native-passkey";
import {
  DEVICE_PRIVATE_KEY,
  DEVICE_PUBLIC_KEY,
  DEVICE_SEED_PHRASE,
} from "../consts";
import { WalletType } from "../enums";
import {
  authenticatePasskey,
  generatePasskeyAuthentication,
  registerPasskey,
  saveExpoPushToken,
  verifyPasskeyRegistration,
} from "../firebase";

export function useGenerateWallet({
  expoPushToken,
  setPaymasterWalletPublicKey,
  setDeviceWalletPublicKey,
}: {
  expoPushToken: string | null;
  setDeviceWalletPublicKey: (
    deviceWalletPublicKey: string | null | undefined
  ) => void;
  setPaymasterWalletPublicKey: (
    paymasterWalletPublicKey: string | null | undefined
  ) => void;
}) {
  return useMutation({
    mutationKey: [
      "generate-wallet",
      expoPushToken,
      setDeviceWalletPublicKey,
      setPaymasterWalletPublicKey,
    ],
    mutationFn: async ({
      walletType,
      username,
      register = true,
      mnemonic,
      callback,
    }: {
      walletType: WalletType;
      register?: boolean;
      username?: string;
      mnemonic?: string;
      callback: () => void;
    }) => {
      let publicKey = "";
      switch (walletType) {
        case WalletType.DEVICE:
          if (!mnemonic) {
            mnemonic = bip39.generateMnemonic(256);
          }
          const seed = await bip39.mnemonicToSeed(mnemonic);
          const path = "m/44'/501'/0'/0'";
          const derivedSeed = derivePath(path, seed.toString("hex")).key;
          const keypair = Keypair.fromSeed(derivedSeed);
          publicKey = keypair.publicKey.toString();

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
          break;
        case WalletType.PAYMASTER:
          const isSupported: boolean = Passkey.isSupported();
          if (!isSupported) {
            throw new Error("Passkey is not supported on this device.");
          }
          if (register) {
            if (!username) {
              throw new Error("Username cannot be empty");
            }
            const request = await registerPasskey(username);
            const response = await Passkey.create(request.options);
            const verifyResult = await verifyPasskeyRegistration({
              requestId: request.requestId,
              response,
            });
            publicKey = verifyResult.publicKey;
          } else {
            const request = await generatePasskeyAuthentication({});
            const response = await Passkey.get(request.options);
            const verifyResult = await authenticatePasskey({
              response,
              userId: response.id,
              requestId: request.requestId,
            });
            publicKey = verifyResult.publicKey;
          }

          break;
      }

      if (expoPushToken) {
        await saveExpoPushToken([publicKey], expoPushToken);
      }

      return { walletType, callback, publicKey };
    },
    onError: (error) => {
      Alert.alert(
        `Error`,
        error instanceof Error ? error.message : JSON.stringify(error)
      );
    },
    onSuccess: async (result) => {
      if (result) {
        if (result.walletType === WalletType.DEVICE) {
          setDeviceWalletPublicKey(result.publicKey);
          result.callback();
        } else {
          setPaymasterWalletPublicKey(result.publicKey);
          result.callback();
        }
      }
    },
  });
}
