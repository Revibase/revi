import { FC, ReactNode } from "react";
import { Sheet, useWindowDimensions, YStack } from "tamagui";
import { Header } from "./header";

export const ScreenWrapper: FC<{
  text: string;
  animation?: any;
  reset?: () => void;
  copy?: () => void;
  children: ReactNode;
}> = ({ reset, text, children, copy, animation }) => {
  const { height } = useWindowDimensions();
  return (
    <YStack
      flex={1}
      enterStyle={animation ?? { opacity: 0, x: -25 }}
      animation={"quick"}
      items="center"
    >
      <Header
        props={{ px: "$2", pt: "$4" }}
        text={text}
        reset={reset}
        copy={copy}
      />
      <Sheet.ScrollView
        showsVerticalScrollIndicator={false}
        width={"100%"}
        height={"100%"}
        contentContainerStyle={{
          grow: 1,
          px: 16,
          pt: 16,
          pb: Math.round(height * 0.1),
        }}
      >
        {children}
      </Sheet.ScrollView>
    </YStack>
  );
};
