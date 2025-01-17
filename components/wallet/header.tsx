import { ArrowLeft } from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { FC } from "react";
import { Text, XStack, XStackProps } from "tamagui";

export const Header: FC<
  {
    text: string;
    reset: () => void;
  } & XStackProps
> = ({ text, reset, ...props }) => {
  return (
    <XStack
      padding="$2"
      justifyContent="space-between"
      alignItems="center"
      width={"100%"}
      {...props}
    >
      <CustomButton
        size={"$3"}
        backgroundColor={"$colorTransparent"}
        onPress={reset}
      >
        <ArrowLeft />
      </CustomButton>
      <Text
        numberOfLines={1}
        textAlign="center"
        fontSize={"$7"}
        fontWeight={800}
      >
        {text}
      </Text>
      <CustomButton size={"$3"} opacity={0}>
        <ArrowLeft />
      </CustomButton>
    </XStack>
  );
};
