import { SmartphoneNfc } from "@tamagui/lucide-icons";
import { Platform } from "react-native";
import { ButtonText, Heading, Sheet, Spinner, YStack } from "tamagui";
import { CustomButton } from "./CustomButton";

export const AndroidNfcSheet = ({
  isNfcSheetVisible,
  handleCloseNfc,
  loading,
}: {
  isNfcSheetVisible: boolean;
  handleCloseNfc: () => Promise<void>;
  loading: boolean;
}) => {
  return (
    <Sheet
      key="nfc-sheet"
      forceRemoveScrollEnabled
      modal={true}
      open={isNfcSheetVisible && Platform.OS === "android"}
      snapPoints={[50]}
      defaultOpen={false}
      zIndex={200000}
      animation="medium"
      snapPointsMode="percent"
    >
      <Sheet.Overlay
        animation="medium"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        onPress={handleCloseNfc}
      />
      <Sheet.Handle theme={"light"} />
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
          padding={"$4"}
          justifyContent="space-between"
          alignItems="center"
          gap={"$4"}
        >
          <Heading textAlign="center" padding={"$4"} color={"black"}>
            Ready To Scan
          </Heading>
          <SmartphoneNfc color={"$blue10"} size={"$10"} strokeWidth={"$0.3"} />
          <CustomButton
            width={"90%"}
            marginBottom={"$4"}
            size={"$4"}
            backgroundColor={"$gray5"}
            onPress={handleCloseNfc}
          >
            {loading && <Spinner />}
            <ButtonText>Cancel</ButtonText>
          </CustomButton>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
};
