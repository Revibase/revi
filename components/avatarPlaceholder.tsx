import { Text, useTheme, YStack } from "tamagui";
import { SignerType } from "utils/enums/transaction";

const AvatarPlaceholder = ({
  type,
  size = 50,
}: {
  type?: SignerType;
  size: number;
}) => {
  function getInitials(type: SignerType | undefined) {
    if (type) {
      return type === SignerType.PRIMARY ? "P" : "S";
    } else {
      return "?";
    }
  }
  const theme = useTheme();
  return (
    <YStack
      alignItems="center"
      justifyContent="center"
      width={size}
      height={size}
      borderRadius={size / 2}
      backgroundColor={
        type
          ? type === SignerType.PRIMARY
            ? theme.blue4.val
            : theme.green4.val
          : theme.red4.val
      }
      overflow="hidden"
    >
      <Text color={theme.color.val} fontSize={size / 2.5} fontWeight="bold">
        {getInitials(type)}
      </Text>
    </YStack>
  );
};

export default AvatarPlaceholder;
