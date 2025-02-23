import { ArrowLeft } from "@tamagui/lucide-icons";
import { CustomButton } from "components/ui/CustomButton";
import { FC, ReactNode } from "react";
import { Heading, XStack, XStackProps } from "tamagui";

export const Header: FC<{
  text: string;
  reset?: () => void;
  rightIcon?: ReactNode;
  props: XStackProps;
}> = ({ text, reset, props, rightIcon }) => {
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

      {rightIcon ? (
        rightIcon
      ) : (
        <CustomButton size={"$3"} opacity={0} bg={"$colorTransparent"}>
          <ArrowLeft />
        </CustomButton>
      )}
    </XStack>
  );
};
