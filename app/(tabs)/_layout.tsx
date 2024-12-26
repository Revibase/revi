import { Globe2, Home, ShieldCheck } from "@tamagui/lucide-icons";
import { Tabs } from "expo-router";
import { PortalProvider, useTheme } from "tamagui";
import { BottomTabs } from "utils/enums/bottomTab";

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

  return (
    <PortalProvider shouldAddRootHost>
      <Tabs
        screenOptions={{
          animation: "shift",
          lazy: false, // Preload screens
          tabBarAllowFontScaling: true,
          tabBarActiveTintColor: color?.val,
          tabBarStyle: {
            paddingTop: "2%",
            height: "10%",
            backgroundColor: background?.val,
            borderTopColor: borderColor?.val,
          },
          headerStyle: {
            backgroundColor: background?.val,
            borderBottomColor: borderColor?.val,
          },
          headerTintColor: color?.val,
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
    </PortalProvider>
  );
}
