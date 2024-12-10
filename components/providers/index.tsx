import { ToastProvider, ToastViewport } from "@tamagui/toast";
import { CustomToast } from "components/CustomToast";
import { useColorScheme } from "react-native";
import { isWeb, TamaguiProvider, type TamaguiProviderProps } from "tamagui";
import { RPC_ENDPOINT } from "utils/consts";
import tamaguiConfig from "utils/tamagui/tamagui.config";
import { CloudProvider } from "./cloudStorageProvider";
import { ConnectionProvider } from "./connectionProvider";
import { OnboardingProvider } from "./onboardingProvider";
import { ReactQueryProvider } from "./reactQuery";

export function Provider({
  children,
  ...rest
}: Omit<TamaguiProviderProps, "config">) {
  const colorScheme = useColorScheme();
  return (
    <ReactQueryProvider>
      <CloudProvider>
        <ConnectionProvider
          config={{ commitment: "processed" }}
          endpoint={RPC_ENDPOINT}
        >
          <OnboardingProvider>
            <TamaguiProvider
              config={tamaguiConfig}
              defaultTheme={colorScheme === "dark" ? "dark" : "light"}
              {...rest}
            >
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
          </OnboardingProvider>
        </ConnectionProvider>
      </CloudProvider>
    </ReactQueryProvider>
  );
}
