import { ToastProvider, ToastViewport } from "@tamagui/toast";

import { CurrentToast } from "components/CurrentToast";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TamaguiProvider, type TamaguiProviderProps } from "tamagui";
import { RPC_ENDPOINT } from "utils/consts";
import tamaguiConfig from "utils/tamagui/tamagui.config";
import { ConnectionProvider } from "./connectionProvider";
import { GlobalProvider } from "./globalProvider";
import { ReactQueryProvider } from "./reactQuery";
export function Provider({
  children,
  ...rest
}: Omit<TamaguiProviderProps, "config">) {
  const { top } = useSafeAreaInsets();
  return (
    <ReactQueryProvider>
      <ConnectionProvider
        config={{ commitment: "processed" }}
        endpoint={RPC_ENDPOINT}
      >
        <GlobalProvider>
          <TamaguiProvider config={tamaguiConfig} {...rest}>
            <ToastProvider
              swipeDirection="horizontal"
              duration={1000}
              native={false}
            >
              {children}
              <CurrentToast />
              <ToastViewport top={top} alignSelf="center" width="80%" />
            </ToastProvider>
          </TamaguiProvider>
        </GlobalProvider>
      </ConnectionProvider>
    </ReactQueryProvider>
  );
}
