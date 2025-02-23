import { ToastProvider, ToastViewport } from "@tamagui/toast";
import { CurrentToast } from "components/ui/CurrentToast";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TamaguiProvider, type TamaguiProviderProps } from "tamagui";
import { RPC_ENDPOINT } from "utils";
import tamaguiConfig from "utils/tamagui/tamagui.config";
import { ConnectionProvider } from "./connectionProvider";
import { ReactQueryProvider } from "./reactQuery";

export function Provider({
  children,
  ...rest
}: Omit<TamaguiProviderProps, "config">) {
  const { top } = useSafeAreaInsets();
  return (
    <ReactQueryProvider>
      <ConnectionProvider
        config={{ commitment: "confirmed" }}
        endpoint={RPC_ENDPOINT}
      >
        <TamaguiProvider config={tamaguiConfig} {...rest}>
          <ToastProvider swipeDirection="horizontal" native={false}>
            {children}
            <CurrentToast />
            <ToastViewport top={top} alignSelf="center" width="80%" />
          </ToastProvider>
        </TamaguiProvider>
      </ConnectionProvider>
    </ReactQueryProvider>
  );
}
