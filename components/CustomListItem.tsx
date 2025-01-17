import { FC } from "react";
import { ListItem, ListItemProps } from "tamagui";

export const CustomListItem: FC<ListItemProps> = ({ ...props }) => {
  return (
    <ListItem
      hoverStyle={{
        backgroundColor: props.backgroundColor,
        borderWidth: props.borderWidth || 0,
        borderColor: props.borderColor || "$colorTransparent",
        bordered: props.bordered || false,
        scale: 0.99,
      }}
      pressStyle={{
        backgroundColor: props.backgroundColor,
        borderWidth: props.borderWidth || 0,
        borderColor: props.borderColor || "$colorTransparent",
        bordered: props.bordered || false,
        scale: 0.99,
      }}
      animation="bouncy"
      {...props}
    >
      {props.children}
    </ListItem>
  );
};
