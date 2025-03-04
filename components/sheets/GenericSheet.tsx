import { FC } from "react";
import { Heading, Sheet, useWindowDimensions } from "tamagui";
import { useGlobalStore } from "utils";

export const GenericSheet: FC = () => {
  const { genericSheetArgs, setGenericSheetArgs } = useGlobalStore();
  const { title, body, theme, snapPoints } = genericSheetArgs ?? {};

  const { height } = useWindowDimensions();
  return (
    <Sheet
      key="nfc-sheet"
      forceRemoveScrollEnabled
      modal={true}
      open={!!genericSheetArgs}
      snapPoints={snapPoints}
      zIndex={300_000}
      animation="medium"
      snapPointsMode="percent"
    >
      <Sheet.Overlay
        animation="medium"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        opacity={0.5}
        onPress={() => setGenericSheetArgs(null)}
      />

      <Sheet.Frame items="center" theme={theme || "accent"}>
        <Sheet.ScrollView
          showsVerticalScrollIndicator={false}
          width={"100%"}
          height={"100%"}
          contentContainerStyle={{
            grow: 1,
            pt: 16,
            px: 16,
            pb: Math.round(height * 0.15),
            gap: 16,
          }}
        >
          {title && (
            <Heading fontSize={"$5"} text="center">
              {title}
            </Heading>
          )}
          {body}
        </Sheet.ScrollView>
      </Sheet.Frame>
    </Sheet>
  );
};
