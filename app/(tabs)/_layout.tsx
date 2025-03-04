import { Handshake, Home, ShieldCheck } from "@tamagui/lucide-icons";
import { useInit, useNotifications } from "components/hooks";
import { AndroidNfcSheet } from "components/sheets/AndroidNfcSheet";
import { GenericSheet } from "components/sheets/GenericSheet";
import { TransactionConfirmationSheet } from "components/sheets/TransactionConfirmationSheet";
import { WalletSheet } from "components/sheets/WalletSheet";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { PortalProvider, useTheme } from "tamagui";
import { BottomTabs } from "utils";

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

  const { initializeDeviceWallet } = useInit();
  const { initializeNotification } = useNotifications();

  useEffect(() => {
    initializeDeviceWallet();
  }, [initializeDeviceWallet]);

  useEffect(() => {
    initializeNotification();
  }, []);

  return (
    <PortalProvider shouldAddRootHost>
      <Tabs
        screenOptions={{
          sceneStyle: {
            backgroundColor: background?.val,
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
      <WalletSheet />
      <TransactionConfirmationSheet />
      <AndroidNfcSheet />
      <GenericSheet />
    </PortalProvider>
  );
}
