import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { useToastController } from "@tamagui/toast";
import { useMutation } from "@tanstack/react-query";
import {
  retrievePrimaryKeypair,
  retrievePrimarySeedPhrase,
} from "utils/queries/useGetPrimaryAddress";

export function useExportPrimaryWallet() {
  const toast = useToastController();
  return useMutation({
    mutationKey: ["export-primary-wallet"],
    mutationFn: async ({ returnMnemonic }: { returnMnemonic: boolean }) => {
      try {
        if (returnMnemonic) {
          const primarySeedPhrase = await retrievePrimarySeedPhrase();
          return primarySeedPhrase;
        } else {
          const primaryKeypair = await retrievePrimaryKeypair();
          return bs58.encode(primaryKeypair.secretKey);
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
