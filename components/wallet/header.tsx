import { ArrowLeft, Copy } from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { FC } from "react";
import { Heading, XStack, XStackProps } from "tamagui";

export const Header: FC<{
  text: string;
  reset?: () => void;
  copy?: () => void;
  props: XStackProps;
}> = ({ text, reset, props, copy }) => {
  return (
    <XStack
      p="$2"
      justify="space-between"
      items="center"
      width={"100%"}
      {...props}
    >
      <CustomButton
        size={"$3"}
        opacity={reset ? 1 : 0}
        bg={"$colorTransparent"}
        onPress={reset}
      >
        <ArrowLeft />
      </CustomButton>

      <Heading
        maxW={"80%"}
        numberOfLines={1}
        text="center"
        size={"$5"}
        fontWeight={700}
      >
        {text}
      </Heading>

      <CustomButton
        onPress={copy}
        size={"$3"}
        opacity={copy ? 1 : 0}
        bg={"$colorTransparent"}
      >
        {copy ? <Copy /> : <ArrowLeft />}
      </CustomButton>
    </XStack>
  );
};
