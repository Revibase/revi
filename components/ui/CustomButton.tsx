import { FC } from "react";
import { Button, ButtonProps } from "tamagui";

export const CustomButton: FC<ButtonProps> = ({ ...props }) => {
  return (
    <Button
      {...props}
      hoverStyle={{
        bg: props.bg,
        borderWidth: props.borderWidth || 0,
        borderColor: props.borderColor || "transparent",
        bordered: props.bordered || false,
        scale: 0.98,
      }}
      pressStyle={{
        bg: props.bg,
        borderWidth: props.borderWidth || 0,
        borderColor: props.borderColor || "transparent",
        bordered: props.bordered || false,
        scale: 0.98,
      }}
      animation="bouncy"
      onPress={(event) => {
        if (props.onPress) {
          props.onPress(event);
        }
      }}
    >
      {props.children}
    </Button>
  );
};
