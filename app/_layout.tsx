import { Provider } from "components/providers";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const unstable_settings = {
  // Ensure that reloading on `/user` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [interLoaded, interError] = useFonts({
    Inter: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
    InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf"),
  });

  useEffect(() => {
    if (interLoaded || interError) {
      // Hide the splash screen after the fonts have loaded (or an error was returned) and the UI is ready.
      SplashScreen.hideAsync();
    }
  }, [interLoaded, interError]);

  if (!interLoaded && !interError) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Provider defaultTheme={colorScheme || "light"}>
        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
              statusBarHidden: false,
              statusBarStyle: colorScheme || "light",
            }}
          />
        </Stack>
      </Provider>
    </SafeAreaView>
  );
}
