import { Keypair } from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Alert } from "react-native";
import * as Keychain from "react-native-keychain";
import { APP_IDENTIFIER } from "utils/consts";
export function useGeneratePrimaryWallet() {
  const client = useQueryClient();
  return useMutation({
    mutationKey: ["generate-primary-wallet"],
    mutationFn: async ({ mnemonic }: { mnemonic?: string }) => {
      try {
        if (!mnemonic) {
          mnemonic = bip39.generateMnemonic(256);
        }
        const seed = await bip39.mnemonicToSeed(mnemonic);
        const path = "m/44'/501'/0'/0'";
        const derivedSeed = derivePath(path, seed.toString("hex")).key;
        const keypair = Keypair.fromSeed(derivedSeed);
        await Keychain.setGenericPassword(
          mnemonic,
          Buffer.from(keypair.secretKey).toString("hex"),
          {
            service: `${APP_IDENTIFIER}-PRIMARY`,
            accessControl:
              Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
            accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
            securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
          }
        );
        return true;
      } catch (error: unknown) {
        Alert.alert(`${error}`);
        return false;
      }
    },
    onSuccess: async (result) => {
      if (result) {
        await Promise.all([
          client.invalidateQueries({
            queryKey: ["get-primary-address"],
          }),
        ]);
      }
    },
  });
}
