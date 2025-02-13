import { FC } from "react";
import { Text, YStack } from "tamagui";
import { Page, useGlobalStore } from "utils";
import { ScreenWrapper } from "./screenWrapper";

export const SwapPage: FC = () => {
  const { setPage } = useGlobalStore();

  return (
    <ScreenWrapper text={"Swap Tokens"} reset={() => setPage(Page.Main)}>
      <YStack items={"center"} justify={"center"} flex={1}>
        <Text fontSize="$8" fontWeight={600}>
          Coming Soon
        </Text>
      </YStack>
    </ScreenWrapper>
  );
};
