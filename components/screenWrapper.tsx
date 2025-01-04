import { FC, ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";

export const ScreenWrapper: FC<{ children: ReactNode }> = ({ children }) => {
  const { top } = useSafeAreaInsets();
  return (
    <YStack paddingTop={top} flex={1}>
      {children}
    </YStack>
  );
};
