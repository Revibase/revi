import { Nfc } from "@tamagui/lucide-icons";
import { FC, useCallback, useState } from "react";
import { Platform } from "react-native";
import { ButtonText, Card, Heading, Sheet, Spinner } from "tamagui";
import { nfcCore, useGlobalStore } from "utils";
import { CustomButton } from "../CustomButton";

export const AndroidNfcSheet: FC = () => {
  const { isNfcSheetVisible, setIsNfcSheetVisible } = useGlobalStore();
  const [loading, setLoading] = useState(false);
  const handleCloseNfc = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    await nfcCore.close();
    if (Platform.OS === "android") {
      setIsNfcSheetVisible(false);
    }
    setLoading(false);
  }, [loading]);
  return (
    <Sheet
      key="nfc-sheet"
      forceRemoveScrollEnabled
      modal={true}
      open={isNfcSheetVisible && Platform.OS === "android"}
      snapPoints={[50]}
      zIndex={300_000}
      animation="medium"
      snapPointsMode="percent"
    >
      <Sheet.Overlay
        animation="medium"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        opacity={0.5}
        onPress={handleCloseNfc}
      />
      <Sheet.Handle />
      <Sheet.Frame items="center" justify="flex-start" bg={"$colorTransparent"}>
        <Card
          elevate
          bordered
          borderTopLeftRadius={"$8"}
          borderTopRightRadius={"$8"}
          borderBottomLeftRadius={"$8"}
          borderBottomRightRadius={"$8"}
          width={"90%"}
          height={"90%"}
          p={"$4"}
          justify="space-between"
          items="center"
        >
          <Card.Header>
            <Heading text="center">Ready To Scan</Heading>
          </Card.Header>
          <Card.Background flex={1} items="center" justify={"center"}>
            <Nfc size={"$12"} />
          </Card.Background>
          <Card.Footer>
            <CustomButton
              bordered
              theme={"accent"}
              width={"90%"}
              size={"$5"}
              onPress={handleCloseNfc}
            >
              {loading && <Spinner />}
              <ButtonText>Cancel</ButtonText>
            </CustomButton>
          </Card.Footer>
        </Card>
      </Sheet.Frame>
    </Sheet>
  );
};
