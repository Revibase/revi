import { useToastController } from "@tamagui/toast";
import * as Clipboard from "expo-clipboard";

export const useCopyToClipboard = () => {
  const toast = useToastController();
  return async (text: string) => {
    await Clipboard.setStringAsync(text);
    toast.show("Copied!", {
      message: text,
      customData: { preset: "success" },
    });
  };
};
