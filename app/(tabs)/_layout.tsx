import {
  Globe2,
  Home,
  ShieldCheck,
  SmartphoneNfc,
} from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { useGlobalVariables } from "components/providers/globalProvider";

import { ScreenWrapper } from "components/ScreenWrapper";
import { Tabs } from "expo-router";
import { useCallback, useState } from "react";
import { Platform } from "react-native";
import {
  ButtonText,
  Heading,
  PortalProvider,
  Sheet,
  Spinner,
  useTheme,
  YStack,
} from "tamagui";
import { BottomTabs } from "utils/enums/bottomTab";
import NfcProxy from "../../utils/apdu";

const bottomTabs = [
  {
    icon: ({ color }) => <Home color={color} />,
    label: BottomTabs.Home,
    name: "index",
  },
  {
    icon: ({ color }) => <Globe2 color={color} />,
    label: BottomTabs.Explore,
    name: "explore",
  },
  {
    icon: ({ color }) => <ShieldCheck color={color} />,
    label: BottomTabs.Wallets,
    name: "profile",
  },
];

export default function TabLayout() {
  const { color, background, borderColor } = useTheme();
  const { isNfcSheetVisible, setNfcSheetVisible } = useGlobalVariables();
  const [loading, setLoading] = useState(false);

  const handleCloseNfc = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    await NfcProxy.close();
    if (Platform.OS === "android") {
      setNfcSheetVisible(false);
    }
    setLoading(false);
  }, [loading, setNfcSheetVisible]);
  return (
    <PortalProvider shouldAddRootHost>
      <ScreenWrapper>
        <Tabs
          screenOptions={{
            sceneStyle: { backgroundColor: background?.val },
            animation: "fade",
            tabBarAllowFontScaling: true,
            tabBarActiveTintColor: color?.val,
            tabBarStyle: {
              paddingTop: "2%",
              height: "10%",
              backgroundColor: background?.val,
              borderTopColor: borderColor?.val,
            },
          }}
        >
          {bottomTabs.map((tab) => (
            <Tabs.Screen
              key={tab.label}
              name={tab.name}
              options={{
                headerShown: false,
                title: tab.label,
                tabBarIcon: tab.icon,
              }}
            />
          ))}
        </Tabs>
      </ScreenWrapper>
      <Sheet
        key="nfc-sheet"
        forceRemoveScrollEnabled
        modal={true}
        open={isNfcSheetVisible && Platform.OS === "android"}
        snapPoints={[50]}
        defaultOpen={false}
        zIndex={200_000}
        animation="medium"
        snapPointsMode="percent"
      >
        <Sheet.Overlay
          animation="medium"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          onPress={handleCloseNfc}
        />
        <Sheet.Handle />
        <Sheet.Frame
          alignItems="center"
          justifyContent="flex-start"
          backgroundColor={"$colorTransparent"}
        >
          <YStack
            elevation={"$4"}
            shadowColor={"$background05"}
            borderRadius={"$8"}
            width={"90%"}
            height={"90%"}
            backgroundColor={"white"}
            padding={"$8"}
            justifyContent="space-between"
            alignItems="center"
            gap={"$4"}
          >
            <Heading>Ready To Scan</Heading>
            <SmartphoneNfc
              color={"$blue10"}
              size={"$12"}
              strokeWidth={"$0.3"}
            />
            <CustomButton
              width={"100%"}
              size={"$5"}
              backgroundColor={"$gray5"}
              onPress={handleCloseNfc}
            >
              {loading && <Spinner />}
              <ButtonText>Cancel</ButtonText>
            </CustomButton>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </PortalProvider>
  );
}
