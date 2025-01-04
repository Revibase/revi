import { AlertCircle, CheckCircle, Info } from "@tamagui/lucide-icons";
import { Toast, useToastState } from "@tamagui/toast";

import { Text, useTheme, XStack, YStack } from "tamagui";

// Define a mapping for icons and colors based on the preset
const presetStyles = (theme: any) => ({
  success: {
    icon: CheckCircle,
    toastColor: theme.green10.val,
  },
  error: {
    icon: AlertCircle,
    toastColor: theme.red10.val,
  },
  info: {
    icon: Info,
    toastColor: theme.blue10.val,
  },
});

export function CurrentToast() {
  const currentToast = useToastState();
  const theme = useTheme();
  if (!currentToast || currentToast.isHandledNatively) return null;

  const preset = currentToast.customData?.preset || "info";
  const { icon: Icon, toastColor } =
    presetStyles(theme)[preset] || presetStyles(theme).info;

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
      backgroundColor={toastColor}
      maxWidth={400}
      borderRadius={"$4"}
    >
      <YStack padding="$1" gap="$1">
        <XStack width={"100%"} alignItems="center" padding={"$1"} gap="$2">
          <Icon size={"$1"} color={"white"} />
          <Text numberOfLines={1} color={"white"} fontSize="$4">
            {currentToast.title}
          </Text>
        </XStack>
        {!!currentToast.message && (
          <Text numberOfLines={2} color={"white"} fontSize={"$3"}>
            {currentToast.message}
          </Text>
        )}
      </YStack>
    </Toast>
  );
}
