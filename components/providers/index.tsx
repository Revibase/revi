import { ToastProvider, ToastViewport } from "@tamagui/toast";
import { CustomToast } from "components/CustomToast";
import { isWeb, TamaguiProvider, type TamaguiProviderProps } from "tamagui";
import { RPC_ENDPOINT } from "utils/consts";
import tamaguiConfig from "utils/tamagui/tamagui.config";
import { ConnectionProvider } from "./connectionProvider";
import { GlobalProvider } from "./globalProvider";
import { ReactQueryProvider } from "./reactQuery";

export function Provider({
  children,
  ...rest
}: Omit<TamaguiProviderProps, "config">) {
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
              duration={6000}
              native={isWeb ? [] : ["mobile"]}
            >
              {children}
              <CustomToast />
              <ToastViewport />
            </ToastProvider>
          </TamaguiProvider>
        </GlobalProvider>
      </ConnectionProvider>
    </ReactQueryProvider>
  );
}
