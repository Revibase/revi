import { FC } from "react";
import { Button, ButtonProps } from "tamagui";

export const CustomButton: FC<ButtonProps> = ({ ...props }) => {
  return (
    <Button
      hoverStyle={{
        backgroundColor: props.backgroundColor,
        borderWidth: props.borderWidth || 0,
        borderColor: props.borderColor || "$colorTransparent",
        bordered: props.bordered || false,
        scale: 0.925,
      }}
      pressStyle={{
        backgroundColor: props.backgroundColor,
        borderWidth: props.borderWidth || 0,
        borderColor: props.borderColor || "$colorTransparent",
        bordered: props.bordered || false,
        scale: 0.925,
      }}
      animation="bouncy"
      {...props}
    >
      {props.children}
    </Button>
  );
};
