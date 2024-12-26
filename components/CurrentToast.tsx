import { AlertCircle, CheckCircle, Info } from "@tamagui/lucide-icons";
import { Toast, useToastState } from "@tamagui/toast";

import { Text, useTheme, XStack, YStack } from "tamagui";

// Define a mapping for icons and colors based on the preset
const presetStyles = (theme: any) => ({
  success: {
    icon: CheckCircle,
    borderColor: theme.green10.val,
    textColor: theme.green10.val,
  },
  error: {
    icon: AlertCircle,
    borderColor: theme.red10.val,
    textColor: theme.red10.val,
  },
  info: {
    icon: Info,
    borderColor: theme.blue10.val,
    textColor: theme.blue10.val,
  },
});

export function CurrentToast() {
  const currentToast = useToastState();
  const theme = useTheme();
  if (!currentToast || currentToast.isHandledNatively) return null;

  const preset = currentToast.customData?.preset || "info";
  const {
    icon: Icon,
    borderColor,
    textColor,
  } = presetStyles(theme)[preset] || presetStyles(theme).info;

  return (
    <Toast
      key={currentToast.id}
      duration={currentToast.duration}
      enterStyle={{ opacity: 0, scale: 0.5, y: -25 }}
      exitStyle={{ opacity: 0, scale: 1, y: -20 }}
      y={0}
      opacity={1}
      scale={1}
      animation="100ms"
      viewportName={currentToast.viewportName}
      backgroundColor={theme.backgroundPress.val}
      borderColor={borderColor}
      borderWidth={"$1"}
      maxWidth={400}
    >
      <YStack
        padding="$0"
        gap="$0"
        backgroundColor={"$colorTransparent"}
        width="90%"
      >
        <XStack width={"100%"} alignItems="center" padding={"$0"} gap="$2">
          <Icon size={"$1"} color={textColor} />
          <Text numberOfLines={1} color={textColor} fontSize="$4">
            {currentToast.title}
          </Text>
        </XStack>
        {!!currentToast.message && (
          <Text numberOfLines={1} color={textColor} fontSize={"$3"}>
            {currentToast.message}
          </Text>
        )}
      </YStack>
    </Toast>
  );
}
