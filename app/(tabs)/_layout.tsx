import { Handshake, Home, ShieldCheck } from "@tamagui/lucide-icons";
import { AndroidNfcSheet } from "components/AndroidNfcSheet";
import { useGlobalVariables } from "components/providers/globalProvider";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import { useCallback, useState } from "react";
import { Platform, TouchableOpacity } from "react-native";
import { PortalProvider, useTheme } from "tamagui";
import { BottomTabs } from "utils/enums/bottomTab";
import NfcProxy from "../../utils/apdu";

const bottomTabs = [
  {
    icon: ({ color }) => <Home color={color} />,
    label: BottomTabs.Home,
    name: "index",
  },
  {
    icon: ({ color }) => <Handshake color={color} />,
    label: BottomTabs.Offers,
    name: "offers",
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
  const theme = useTheme();
  return (
    <PortalProvider shouldAddRootHost>
      <Tabs
        screenOptions={{
          sceneStyle: {
            backgroundColor: theme.background.val,
          },
          animation: "none",
          tabBarAllowFontScaling: true,
          tabBarActiveTintColor: color?.val,
          tabBarButton: (props) => (
            <TouchableOpacity
              onPress={(event) => {
                if (props.accessibilityState?.selected) {
                  Haptics.selectionAsync();
                } else {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                props.onPress?.(event);
              }}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {props.children}
            </TouchableOpacity>
          ),
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
      <AndroidNfcSheet
        isNfcSheetVisible={isNfcSheetVisible}
        handleCloseNfc={handleCloseNfc}
        loading={loading}
      />
    </PortalProvider>
  );
}
