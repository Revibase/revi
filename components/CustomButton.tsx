import * as Haptics from "expo-haptics";
import { FC } from "react";
import { Button, ButtonProps } from "tamagui";

export const CustomButton: FC<ButtonProps> = ({ ...props }) => {
  return (
    <Button
      {...props}
      hoverStyle={{
        backgroundColor: props.backgroundColor,
        borderWidth: props.borderWidth || 0,
        borderColor: props.borderColor || "$colorTransparent",
        bordered: props.bordered || false,
        scale: 0.98,
      }}
      pressStyle={{
        backgroundColor: props.backgroundColor,
        borderWidth: props.borderWidth || 0,
        borderColor: props.borderColor || "$colorTransparent",
        bordered: props.bordered || false,
        scale: 0.98,
      }}
      animation="bouncy"
      onPress={(event) => {
        if (props.onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          props.onPress(event);
        }
      }}
    >
      {props.children}
    </Button>
  );
};
