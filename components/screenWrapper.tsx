import { FC, ReactNode } from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  ButtonText,
  Sheet,
  Spinner,
  Text,
  useTheme,
  YStack,
} from "tamagui";
import { useGlobalVariables } from "./providers/globalProvider";

import NfcProxy from "../utils/apdu/index";

export const ScreenWrapper: FC<{ children: ReactNode }> = ({ children }) => {
  const { top } = useSafeAreaInsets();
  const theme = useTheme();
  const { isNfcSheetVisible, setNfcSheetVisible } = useGlobalVariables();

  return (
    <YStack paddingTop={top} backgroundColor={theme.background?.val} flex={1}>
      {children}
      <Sheet
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
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          key="nfc-overlay"
          opacity={0.5}
          onPress={async () => {
            setNfcSheetVisible(false);
            await NfcProxy.close();
          }}
        />

        <Sheet.Handle />
        <Sheet.Frame
          padding="$8"
          justifyContent="center"
          alignItems="center"
          gap="$8"
        >
          <Spinner size="large" color="$color" />
          <Text fontSize="$6" fontWeight="bold">
            Hold your device near an NFC tag.
          </Text>
          <Button
            width={"100%"}
            onPress={async () => {
              setNfcSheetVisible(false);
              await NfcProxy.close();
            }}
          >
            <ButtonText>Cancel</ButtonText>
          </Button>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
};
