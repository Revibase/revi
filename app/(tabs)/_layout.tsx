import { Globe, Home, User } from "@tamagui/lucide-icons";
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
    icon: ({ color }) => <Globe color={color} />,
    label: BottomTabs.Explore,
    name: "explore",
  },
  {
    icon: ({ color }) => <User color={color} />,
    label: BottomTabs.Profile,
    name: "profile",
  },
];

export default function TabLayout() {
  const theme = useTheme();

  return (
    <PortalProvider shouldAddRootHost>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.red10.val,
          tabBarStyle: {
            backgroundColor: theme.background.val,
            borderTopColor: theme.borderColor.val,
          },
          headerStyle: {
            backgroundColor: theme.background.val,
            borderBottomColor: theme.borderColor.val,
          },
          headerTintColor: theme.color.val,
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
