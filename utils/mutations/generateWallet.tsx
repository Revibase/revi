import { useMutation } from "@tanstack/react-query";
import { Alert } from "react-native";
<<<<<<< Updated upstream
import { CloudStorage } from "react-native-cloud-storage";
import * as Keychain from "react-native-keychain";
import {
  CLOUD_PRIVATE_KEY,
  CLOUD_PUBLIC_KEY,
  CLOUD_SEED_PHRASE,
  DEVICE_PRIVATE_KEY,
  DEVICE_PUBLIC_KEY,
  DEVICE_SEED_PHRASE,
} from "../consts";
=======
import { Passkey } from "react-native-passkey";
import { getKeypairFromMnemonic } from "utils/secure";
>>>>>>> Stashed changes
import { WalletType } from "../enums";
import { logError, saveExpoPushToken } from "../firebase";
import { getCloudWalletPublicKey, getDeviceWalletPublicKey } from "../secure";

export function useGenerateWallet({
  expoPushToken,
  cloudStorage,
  setCloudWalletPublicKey,
  setDeviceWalletPublicKey,
}: {
  expoPushToken: string | null;
  cloudStorage: CloudStorage | null;
  setDeviceWalletPublicKey: (
    deviceWalletPublicKey: string | null | undefined
  ) => void;
  setCloudWalletPublicKey: (
    cloudWalletPublicKey: string | null | undefined
  ) => void;
}) {
  return useMutation({
    mutationKey: [
      "generate-wallet",
      expoPushToken,
      cloudStorage,
      setDeviceWalletPublicKey,
      setCloudWalletPublicKey,
    ],
    mutationFn: async ({
      walletType,
      mnemonic,
      callback,
    }: {
      walletType: WalletType;
      mnemonic?: string;
      callback: () => void;
    }) => {
      if (!mnemonic) {
        mnemonic = bip39.generateMnemonic(256);
      }
      const seed = await bip39.mnemonicToSeed(mnemonic);
      const path = "m/44'/501'/0'/0'";
      const derivedSeed = derivePath(path, seed.toString("hex")).key;
      const keypair = Keypair.fromSeed(derivedSeed);
      switch (walletType) {
        case WalletType.DEVICE:
<<<<<<< Updated upstream
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
=======
          const encoder = new TextEncoder();
          const mnemonicBuffer = mnemonic
            ? encoder.encode(mnemonic)
            : undefined;
          const keypair = await getKeypairFromMnemonic(mnemonicBuffer, true);
          publicKey = keypair.publicKey.toString();

>>>>>>> Stashed changes
          break;
        case WalletType.CLOUD:
          if (!cloudStorage || !(await cloudStorage.isCloudAvailable())) {
            throw new Error("Cloudstorage is unavailable");
          }
<<<<<<< Updated upstream
          await cloudStorage.writeFile(
            CLOUD_PUBLIC_KEY,
            keypair.publicKey.toString()
          );
          await cloudStorage.writeFile(
            CLOUD_PRIVATE_KEY,
            Buffer.from(keypair.secretKey).toString("hex")
          );
          await cloudStorage.writeFile(CLOUD_SEED_PHRASE, mnemonic);
=======
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
>>>>>>> Stashed changes
          break;
      }
      if (expoPushToken) {
<<<<<<< Updated upstream
        await saveExpoPushToken([keypair.publicKey.toString()], expoPushToken);
=======
        await saveExpoPushToken(
          publicKey,
          expoPushToken,
          walletType === WalletType.PAYMASTER
        );
>>>>>>> Stashed changes
      }
      return { walletType, callback };
    },
    onError: (error) => {
      logError(error);
      Alert.alert(
        `Create Wallet failed!`,
        error instanceof Error ? error.message : String(error)
      );
    },
    onSuccess: async (result) => {
      if (result) {
        if (result.walletType === WalletType.DEVICE) {
          const response = await getDeviceWalletPublicKey();
          setDeviceWalletPublicKey(response);
          result.callback();
<<<<<<< Updated upstream
        } else {
          const response = await getCloudWalletPublicKey(cloudStorage);
          setCloudWalletPublicKey(response);
=======
        } else if (result.walletType === WalletType.PAYMASTER) {
          setPaymasterWalletPublicKey(result.publicKey);
>>>>>>> Stashed changes
          result.callback();
        }
      }
    },
  });
}
