import { Image } from "expo-image";
import { FC } from "react";
import { Card, CardProps } from "tamagui";
import { proxify } from "utils";
export const CustomCard: FC<CardProps & { url: string }> = ({
  url,
  ...props
}) => {
  return (
    <Card items="center" justify="center" aspectRatio="0.71" elevate {...props}>
      <Card.Background>
        <Image
          style={{
            height: "100%",
            width: "100%",
            borderRadius: 8,
          }}
          contentFit="cover"
          source={{
            uri: proxify(url),
          }}
        />
      </Card.Background>
    </Card>
  );
};
